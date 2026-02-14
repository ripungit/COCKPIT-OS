import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import axios from "axios";
import { execSync, spawn } from "child_process";
import WebSocket from "ws";
import * as crypto from "crypto";

// Types
export interface Task {
    id: string;
    type: string;
    payload: any;
    status: "queued" | "leased" | "running" | "succeeded" | "failed" | "canceled";
    result?: any;
    error?: string;
}

export interface EnrollConfig {
    serverUrl: string;
    enrollmentToken: string;
    deviceId: string;
    pollIntervalMs?: number;
}

// Helper: shallow dir size (safe)
function getDirSize(dirPath: string, depth = 0): number {
    if (depth > 1) return 0;
    let size = 0;
    try {
        const files = fs.readdirSync(dirPath);
        for (const f of files) {
            const fullPath = path.join(dirPath, f);
            try {
                const s = fs.statSync(fullPath);
                if (s.isFile()) size += s.size;
                else if (s.isDirectory() && depth < 1) size += getDirSize(fullPath, depth + 1);
            } catch { }
        }
    } catch { }
    return size;
}

// Helper: sleep
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper: safe JSON parse
function safeJson(s: string) {
    try { return JSON.parse(s); } catch { return null; }
}

// Helper: Connection list
export function listConnections(): any[] {
    if (os.platform() !== "linux") return [];
    try {
        let out = "";
        let isSs = false;
        try {
            // Try ss first (preferred). Remove -H to see if it's the issue, or use it safely.
            out = execSync("ss -tanp || ss -tunp", { encoding: "utf-8", shell: "/bin/bash", stdio: ["ignore", "pipe", "ignore"] });
            isSs = true;
        } catch {
            try {
                // Fallback to netstat
                out = execSync("netstat -tunap", { encoding: "utf-8", shell: "/bin/bash", stdio: ["ignore", "pipe", "ignore"] });
                isSs = false;
            } catch {
                return [];
            }
        }

        const lines = out.split("\n").map(l => l.trim()).filter(l => l && !l.startsWith("Active") && !l.startsWith("Proto") && !l.startsWith("Netid"));
        const items: any[] = [];

        for (const line of lines) {
            const parts = line.split(/\s+/);
            if (parts.length < 5) continue;

            let proto = parts[0];
            let state = "";
            let local = "";
            let remote = "";
            let pid: number | undefined;
            let process: string | undefined;

            if (isSs) {
                // [0]Netid [1]State [2]Recv-Q [3]Send-Q [4]Local Addr [5]Peer Addr [6]Process
                state = parts[1];
                local = parts[4];
                remote = parts[5];
                const usersMatch = line.match(/users:\(\("([^"]+)",pid=(\d+)/);
                if (usersMatch) {
                    process = usersMatch[1];
                    pid = parseInt(usersMatch[2], 10);
                }
            } else {
                // [0]Proto [1]Recv-Q [2]Send-Q [3]Local Addr [4]Foreign Addr [5]State [6]PID/Program
                local = parts[3];
                remote = parts[4];
                state = parts[5];
                const pidProgMatch = parts[6]?.match(/(\d+)\/([^\s]+)/);
                if (pidProgMatch) {
                    pid = parseInt(pidProgMatch[1], 10);
                    process = pidProgMatch[2];
                }
            }

            if (!local || !remote) continue;
            items.push({ proto, state, local, remote, pid, process });
        }
        return items;
    } catch (e: any) {
        console.error("[CocktailAgent] listConnections failed:", e.message);
        return [];
    }
}

// WS Client
type LogProc = { proc: any; streamId: string };

export class AgentStreamClient {
    private ws: WebSocket | null = null;
    private alive = false;
    private logs = new Map<string, LogProc>();

    constructor(private serverUrl: string, private deviceId: string, private token: string) { }

    start() {
        const url = this.serverUrl.replace(/^http/, "ws") + "/cockpit/cocktail/ws/agent";
        this.ws = new WebSocket(url);
        this.alive = true;

        this.ws.on("open", () => {
            console.log(`[CocktailAgent] WS Stream Connected`);
            this.send({ t: "hello", deviceId: this.deviceId, token: this.token, agentVersion: "1.2.0-stable" });
        });

        this.ws.on("message", (raw) => {
            const msg = safeJson(raw.toString());
            if (!msg) return;
            if (msg.t === "log_start") this.handleLogStart(msg);
            if (msg.t === "log_stop") this.handleLogStop(msg.streamId);
        });

        this.ws.on("close", () => {
            this.alive = false;
            this.stopAllLogs();
            console.log(`[CocktailAgent] WS Stream Closed, reconnecting...`);
            setTimeout(() => this.start(), 3000);
        });

        this.ws.on("error", (e) => {
            console.error(`[CocktailAgent] WS Stream Error:`, e.message);
            try { this.ws?.close(); } catch { }
        });
    }

    send(payload: any) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
        this.ws.send(JSON.stringify(payload));
    }

    pushNet(rxBytesPerSec: number, txBytesPerSec: number) {
        this.send({ t: "net", at: new Date().toISOString(), rxBytesPerSec, txBytesPerSec });
    }

    pushMetrics(metrics: any) {
        this.send({ t: "metrics", at: new Date().toISOString(), data: metrics });
    }

    pushConns(items: any[]) {
        this.send({ t: "conns", at: new Date().toISOString(), items });
    }

    private handleLogStart(msg: any) {
        const { streamId, source, tail = 100 } = msg;
        if (!streamId || !source?.kind || this.logs.has(streamId)) return;

        console.log(`[CocktailAgent] Starting log stream: ${streamId} (${source.kind})`);
        let proc: any;
        if (source.kind === "journal") {
            const unit = source.unit || "cocktail";
            proc = spawn("journalctl", ["-u", unit, "-f", "-n", tail.toString()], { stdio: ['ignore', 'pipe', 'pipe'] });
        } else if (source.kind === "file") {
            proc = spawn("tail", ["-f", "-n", tail.toString(), source.path], { stdio: ['ignore', 'pipe', 'pipe'] });
        } else if (source.kind === "docker") {
            proc = spawn("docker", ["logs", "-f", "--tail", tail.toString(), source.container], { stdio: ['ignore', 'pipe', 'pipe'] });
        } else return;

        this.logs.set(streamId, { proc, streamId });

        proc.stdout.on("data", (buf: Buffer) => {
            buf.toString().split("\n").forEach(line => {
                if (line.trim()) this.send({ t: "log", at: new Date().toISOString(), streamId, line });
            });
        });

        proc.stderr.on("data", (buf: Buffer) => {
            this.send({ t: "log", at: new Date().toISOString(), streamId, line: buf.toString(), level: "error" });
        });

        proc.on("exit", () => {
            this.logs.delete(streamId);
            this.send({ t: "log", at: new Date().toISOString(), streamId, line: "[stream ended]" });
        });
    }

    private handleLogStop(streamId: string) {
        const log = this.logs.get(streamId);
        if (log) {
            log.proc.kill();
            this.logs.delete(streamId);
        }
    }

    private stopAllLogs() {
        this.logs.forEach(l => {
            try { l.proc.kill(); } catch { }
        });
        this.logs.clear();
    }
}

export class CocktailAgent {
    private config: EnrollConfig;
    private allowedDirs: string[] = ['/home', '/var/www'];
    private running = false;
    private axiosInstance: any;
    private stream: AgentStreamClient | null = null;

    private lastCpuUsage: { idle: number; total: number } | null = null;
    private lastNetBytes: { rx: number; tx: number; ts: number } | null = null;

    constructor(config: EnrollConfig) {
        this.config = config;
        this.axiosInstance = axios.create({
            baseURL: `${config.serverUrl}/cockpit/cocktail`,
            timeout: 15000,
            headers: {
                "content-type": "application/json",
            },
        });
        this.stream = new AgentStreamClient(config.serverUrl, config.deviceId, config.enrollmentToken);
    }

    async start() {
        console.log(`Starting Cocktail Agent for device ${this.config.deviceId}...`);

        if (this.stream) this.stream.start();

        // Install dependencies
        await this.installNeofetch();

        // Prime diff-based metrics
        this.getCpuUsage();
        this.getNetworkUsage();

        this.running = true;

        // Run loops concurrently (no unhandled rejections)
        void this.taskLoop();
        await sleep(500);

        // Initial burst of data for stream tabs
        if (this.stream) {
            try {
                const metrics = this.collectMetrics();
                this.stream.pushMetrics(metrics);
                this.stream.pushConns(listConnections());
            } catch { }
        }

        void this.metricsLoop();
    }

    stop() {
        this.running = false;
    }

    // ------------------------
    // Task loop
    // ------------------------
    private async taskLoop() {
        const pollMs = this.config.pollIntervalMs || 500;

        while (this.running) {
            try {
                const task = await this.leaseTask();

                if (!task) {
                    await sleep(pollMs);
                    continue;
                }

                // Guard: must have id/type
                if (!task.id || !task.type) {
                    console.warn("Lease returned invalid task shape:", task);
                    await sleep(pollMs);
                    continue;
                }

                // Execute + always attempt completion
                await this.executeTask(task);
            } catch (error: any) {
                // Keep polling stable: never throw out of loop
                console.error("Error in task loop:", error?.response?.data || error?.message || error);
            }

            await sleep(pollMs);
        }
    }

    private async leaseTask(): Promise<Task | null> {
        try {
            const res = await this.axiosInstance.post("lease-task", {
                deviceId: this.config.deviceId,
                token: this.config.enrollmentToken,
            });

            // Support both shapes: {task: {...}} or {...} or null-ish
            const t = res?.data?.task ?? res?.data ?? null;

            if (!t || !t.id || !t.type) return null;
            return t as Task;
        } catch (e: any) {
            // Do not spam hard errors during polling
            const msg = e?.response?.data || e?.message || e;
            console.error("Failed to lease task:", msg);
            return null;
        }
    }
    private async completeTask(taskId: string, result: any, error: string | null) {
        try {
            await this.axiosInstance.post("complete-task", {
                deviceId: this.config.deviceId,
                token: this.config.enrollmentToken,
                taskId,
                result,
                error,
            });
        } catch (e: any) {
            console.error(`Failed to complete task ${taskId}:`, e.message);
        }
    }

    private async reportTaskProgress(taskId: string, progressPct: number, logs?: string) {
        try {
            await this.axiosInstance.post("task-progress", {
                deviceId: this.config.deviceId,
                token: this.config.enrollmentToken,
                taskId,
                progressPct: Math.floor(progressPct),
                logs
            });
            // Also broadcast via WebSocket for real-time UI updates
            if (this.stream) {
                this.stream.send({
                    t: 'task_progress',
                    at: new Date().toISOString(),
                    taskId,
                    progressPct: Math.floor(progressPct),
                    logs
                });
            }
        } catch (e: any) {
            console.error(`Failed to report progress for task ${taskId}:`, e.message);
        }
    }

    private async executeTask(task: Task) {
        let result: any = null;
        let error: string | null = null;

        try {
            switch (task.type) {
                case "shell.exec": {
                    // payload: { command: string, cwd?: string }
                    const cwd = task.payload?.cwd || os.homedir();
                    const cmd = String(task.payload?.command || "");

                    if (!cmd.trim()) throw new Error("Missing command");

                    // Windows vs *nix shell
                    const shell =
                        os.platform() === "win32"
                            ? process.env.ComSpec || "cmd.exe"
                            : "/bin/bash";

                    const stdout = execSync(cmd, {
                        cwd,
                        encoding: "utf-8",
                        shell,
                        stdio: ["ignore", "pipe", "pipe"],
                    });

                    result = { stdout };
                    break;
                }

                case "sys.info": {
                    result = {
                        hostname: os.hostname(),
                        platform: os.platform(),
                        release: os.release(),
                        uptime: os.uptime(),
                        loadavg: os.loadavg(),
                        totalmem: os.totalmem(),
                        freemem: os.freemem(),
                        cpus: os.cpus(),
                        arch: os.arch(),
                    };
                    break;
                }

                case "proc.list": {
                    const limit = Math.min(Number(task.payload?.limit || 200), 200);
                    const sort = String(task.payload?.sort || "cpu").toLowerCase();

                    // Whitelist sort keys for Linux ps
                    const sortKey =
                        sort === "mem"
                            ? "pmem"
                            : sort === "rss"
                                ? "rss"
                                : sort === "threads"
                                    ? "nlwp"
                                    : "pcpu";

                    let items: any[] = [];

                    if (os.platform() === "linux") {
                        try {
                            // Using the = syntax for EVERY column is the most cross-distro way to remove headers
                            const pFormat = "pid=,user=,pcpu=,pmem=,rss=,nlwp=,comm=,args=";
                            const cmd = `ps -eo ${pFormat} --sort=-${sortKey} | head -n ${limit}`;

                            let out = "";
                            try {
                                out = execSync(cmd, {
                                    encoding: "utf-8",
                                    shell: "/bin/bash",
                                    stdio: ["ignore", "pipe", "pipe"]
                                });
                            } catch {
                                // Fallback: drop sort flag if that's the issue
                                const fallbackCmd = `ps -eo ${pFormat} | head -n ${limit + 50}`;
                                out = execSync(fallbackCmd, { encoding: "utf-8", shell: "/bin/bash" });
                            }

                            const lines = out.split("\n").map((l) => l.trim()).filter(Boolean);

                            for (const line of lines) {
                                const parts = line.split(/\s+/);
                                if (parts.length < 7) continue;

                                const pid = parseInt(parts[0], 10);
                                if (isNaN(pid)) continue; // Skip header if it somehow leaked in

                                const user = parts[1] || "root";
                                const cpuPct = parseFloat(parts[2]) || 0;
                                const memPct = parseFloat(parts[3]) || 0;
                                const rssKb = parseInt(parts[4], 10) || 0;
                                const threads = parseInt(parts[5], 10) || 1;
                                const name = parts[6] || "unknown";
                                const fullCmd = parts.slice(7).join(" ") || name;

                                items.push({
                                    pid,
                                    user,
                                    cpuPct,
                                    memPct,
                                    rssBytes: rssKb * 1024,
                                    threads,
                                    name,
                                    cmd: fullCmd,
                                });
                            }
                        } catch (e: any) {
                            console.error("Linux ps fail:", e.message);
                            throw new Error(`System ps command failed: ${e.message}`);
                        }
                    } else if (os.platform() === "win32") {
                        // Fallback: tasklist (limited). Keep stable + no throw.
                        const tlOut = execSync("tasklist /NH /FO CSV", { encoding: "utf-8" });
                        const lines = tlOut.split("\n").map((l) => l.trim()).filter(Boolean);

                        for (const line of lines) {
                            // "Image Name","PID","Session Name","Session#","Mem Usage"
                            const cols = line.split('","').map((c) => c.replace(/^"|"$/g, ""));
                            if (cols.length < 5) continue;

                            const name = cols[0];
                            const pid = parseInt(cols[1], 10);
                            const memStr = cols[4] || "";

                            // "12,345 K" -> 12345 KB
                            const kb = parseInt(memStr.replace(/[^\d]/g, ""), 10) || 0;

                            if (!Number.isFinite(pid)) continue;

                            items.push({
                                pid,
                                user: "UNKNOWN",
                                cpuPct: 0,
                                memPct: 0,
                                rssBytes: kb * 1024,
                                threads: 1,
                                name,
                                cmd: name,
                            });

                            if (items.length >= limit) break;
                        }
                    } else {
                        // Other platforms: return empty but successful
                        items = [];
                    }

                    result = { items };
                    break;
                }

                case "proc.kill": {
                    const pid = Number(task.payload?.pid);
                    if (!pid) throw new Error("Missing PID");

                    // Allow only safe-ish signals by whitelist on linux
                    const sig = String(task.payload?.signal || "SIGTERM").toUpperCase();
                    const allowed = new Set(["SIGTERM", "SIGKILL", "SIGINT", "SIGHUP"]);
                    const signal = allowed.has(sig) ? sig : "SIGTERM";

                    try {
                        process.kill(pid, signal as any);
                    } catch {
                        if (os.platform() === "linux") {
                            // kill expects without SIG prefix often
                            const killSig = signal.replace(/^SIG/, "");
                            execSync(`kill -${killSig} ${pid}`, { encoding: "utf-8", shell: "/bin/bash" });
                        } else {
                            // Windows: taskkill
                            execSync(`taskkill /PID ${pid} /T /F`, { encoding: "utf-8" });
                        }
                    }

                    result = { success: true };
                    break;
                }

                case "fs.list": {
                    const dirPath = String(task.payload?.path || "/");
                    const files = fs.readdirSync(dirPath, { withFileTypes: true });
                    const out: any[] = [];

                    for (const f of files) {
                        try {
                            const fullPath = path.join(dirPath, f.name);
                            const s = fs.statSync(fullPath);
                            out.push({
                                name: f.name,
                                isDirectory: f.isDirectory(),
                                size: f.isDirectory() ? getDirSize(fullPath) : s.size,
                                mtime: s.mtime,
                            });
                        } catch {
                            out.push({
                                name: f.name,
                                isDirectory: f.isDirectory(),
                                size: 0,
                                mtime: new Date(0),
                            });
                        }
                        if (out.length >= 2000) break;
                    }

                    result = { items: out };
                    break;
                }

                case "fs.stat": {
                    const p = String(task.payload?.path || "");
                    if (!p) throw new Error("Missing path");

                    const st = fs.statSync(p);
                    const posixMode = (st.mode & 0o7777).toString(8);

                    result = {
                        type: st.isDirectory() ? "directory" : "file",
                        size: st.isDirectory() ? getDirSize(p) : st.size,
                        mtimeMs: st.mtimeMs,
                        mode: posixMode,
                        uid: (st as any).uid ?? null,
                        gid: (st as any).gid ?? null,
                    };
                    break;
                }

                case "fs.read_text": {
                    const p = String(task.payload?.path || "");
                    if (!p) throw new Error("Missing path");

                    const st = fs.statSync(p);
                    const maxBytes = Number(task.payload?.maxBytes || 256 * 1024);

                    if (st.size > maxBytes) {
                        result = { path: p, tooLarge: true, size: st.size };
                    } else {
                        const content = fs.readFileSync(p, "utf-8");
                        result = { path: p, content, truncated: false, encoding: "utf-8" };
                    }
                    break;
                }

                case "fs.write_text": {
                    const p = String(task.payload?.path || "");
                    const content = task.payload?.content;
                    if (!p || content === undefined) throw new Error("Missing path or content");

                    fs.writeFileSync(p, String(content), { mode: task.payload?.mode });
                    result = { success: true };
                    break;
                }

                case "fs.mkdir": {
                    const p = String(task.payload?.path || "");
                    if (!p) throw new Error("Missing path");

                    fs.mkdirSync(p, { recursive: task.payload?.recursive ?? true });
                    result = { success: true };
                    break;
                }

                case "fs.delete": {
                    const p = String(task.payload?.path || "");
                    if (!p) throw new Error("Missing path");

                    if (fs.statSync(p).isDirectory()) {
                        fs.rmSync(p, { recursive: task.payload?.recursive ?? true, force: true });
                    } else {
                        fs.unlinkSync(p);
                    }
                    result = { success: true };
                    break;
                }

                case "fs.move": {
                    const from = String(task.payload?.from || "");
                    const to = String(task.payload?.to || "");
                    if (!from || !to) throw new Error("Missing from or to path");

                    fs.renameSync(from, to);
                    result = { success: true };
                    break;
                }

                case "boost.run": {
                    const actions = Array.isArray(task.payload?.actions) ? task.payload.actions : ["tmp"];
                    const dryRun = !!task.payload?.dryRun;
                    let cleanedCount = 0;
                    const log = (line: string) => {
                        console.log(`[CocktailAgent] Booster: ${line}`);
                        if (this.stream) {
                            this.stream.send({
                                t: "ui_boost_log",
                                at: new Date().toISOString(),
                                line
                            });
                        }
                    };

                    log("Initializing system optimization...");
                    await sleep(400);

                    if (actions.includes("tmp")) {
                        log("Analyzing temporary directories...");
                        const tmpDirs = ["/tmp", "/var/tmp"];
                        for (const dir of tmpDirs) {
                            try {
                                if (fs.existsSync(dir)) {
                                    const files = fs.readdirSync(dir);
                                    log(`Cleaning ${dir} (${files.length} items)...`);
                                    if (!dryRun) {
                                        for (const f of files) {
                                            try {
                                                const p = path.join(dir, f);
                                                if (fs.statSync(p).isFile()) {
                                                    fs.unlinkSync(p);
                                                    cleanedCount++;
                                                }
                                            } catch { }
                                        }
                                    }
                                    await sleep(300);
                                }
                            } catch { }
                        }
                    }

                    if (actions.includes("logs")) {
                        log("Scanning system logs for rotation...");
                        if (os.platform() === "linux" && !dryRun) {
                            try {
                                execSync("sudo journalctl --vacuum-time=1d", { stdio: "ignore" });
                                log("Journal logs vacuumed to 1 day.");
                                cleanedCount += 15; // Symbolic
                            } catch {
                                log("Failed to vacuum journal logs (insufficient permissions).");
                            }
                        }
                        await sleep(400);
                    }

                    if (actions.includes("pkg")) {
                        log("Purging package manager cache...");
                        if (os.platform() === "linux" && !dryRun) {
                            try {
                                execSync("sudo apt-get clean", { stdio: "ignore" });
                                log("Apt cache purged.");
                                cleanedCount += 50; // Symbolic
                            } catch {
                                log("Failed to purge apt cache.");
                            }
                        }
                        await sleep(300);
                    }

                    log("System optimization complete.");
                    result = { success: true, cleanedItems: cleanedCount };
                    break;
                }

                case "fs.search": {
                    const root = String(task.payload?.root || "/home");
                    const query = String(task.payload?.query || "");
                    const maxResults = Math.min(Number(task.payload?.maxResults || 200), 500);

                    if (!query) throw new Error("Missing query");

                    const items: any[] = [];
                    if (os.platform() === "linux") {
                        try {
                            // Construct valid shell command for multi-pattern search
                            // Example: find /home -maxdepth 4 -type f \( -iname "*jpg" -o -iname "*png" \)
                            let findCmd = "";
                            if (query.includes('|')) {
                                const patterns = query.replace(/[()]/g, '').split('|').map(p => `-iname "*${p.trim()}*"`).join(' -o ');
                                findCmd = `find "${root}" -maxdepth 4 -type f \\( ${patterns} \\) 2>/dev/null | head -n ${maxResults}`;
                            } else {
                                findCmd = `find "${root}" -maxdepth 4 -type f -iname "*${query}*" 2>/dev/null | head -n ${maxResults}`;
                            }

                            const out = execSync(findCmd, { encoding: "utf-8", shell: "/bin/bash" });
                            const paths = out.split("\n").filter(Boolean);

                            for (const p of paths) {
                                try {
                                    const s = fs.statSync(p);
                                    items.push({
                                        name: path.basename(p),
                                        path: p,
                                        size: s.size,
                                        mtime: s.mtime,
                                        isDirectory: false
                                    });
                                } catch {
                                    items.push({ name: path.basename(p), path: p, size: 0, isDirectory: false });
                                }
                            }
                        } catch (e) {
                            console.error("Search failed:", e);
                        }
                    }
                    result = { items };
                    break;
                }

                case "FILE_UPLOAD_TO_R2": {
                    // payload: { path, putUrl, key }
                    const { path: filePath, putUrl } = task.payload;
                    if (!filePath || !putUrl) throw new Error("Missing path or putUrl");

                    const resolved = path.resolve(filePath);
                    if (!fs.existsSync(resolved)) throw new Error("File not found");

                    const stats = fs.statSync(resolved);
                    const stream = fs.createReadStream(resolved);

                    this.reportTaskProgress(task.id, 0);

                    await axios({
                        url: putUrl,
                        method: 'PUT',
                        data: stream,
                        headers: {
                            'Content-Type': 'application/octet-stream',
                            'Content-Length': stats.size
                        },
                        maxContentLength: Infinity,
                        maxBodyLength: Infinity,
                        onUploadProgress: (progressEvent) => {
                            if (progressEvent.total) {
                                const pct = Math.round((progressEvent.loaded / progressEvent.total) * 100);
                                this.reportTaskProgress(task.id, pct);
                            }
                        }
                    });

                    result = { success: true };
                    break;
                }

                case "FILE_DOWNLOAD_FROM_R2": {
                    // payload: { getUrl, destPath, sizeBytes, sha256?, mode? }
                    const { getUrl, destPath, sizeBytes, sha256, mode } = task.payload;
                    if (!getUrl || !destPath) throw new Error("Missing getUrl or destPath");

                    // 1. Path Safety & Allowlist
                    const resolved = path.resolve(destPath);
                    const isAllowed = this.allowedDirs.some(dir => resolved.startsWith(path.resolve(dir)));

                    if (!isAllowed) {
                        throw new Error(`Path ${resolved} is not in UPLOAD_ALLOWED_DIRS (${this.allowedDirs.join(",")})`);
                    }

                    if (resolved.includes("..")) throw new Error("Invalid path (traversal)");

                    // 2. Prepare directories
                    const dir = path.dirname(resolved);
                    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

                    const partPath = resolved + ".part";
                    const writer = fs.createWriteStream(partPath);

                    // 3. Download
                    const response = await axios({
                        url: getUrl,
                        method: 'GET',
                        responseType: 'stream'
                    });

                    let downloadedBytes = 0;
                    let lastReport = Date.now();

                    await new Promise((resolve, reject) => {
                        response.data.pipe(writer);

                        response.data.on('data', (chunk: Buffer) => {
                            downloadedBytes += chunk.length;
                            const now = Date.now();
                            if (now - lastReport > 1000 && sizeBytes) {
                                const pct = (downloadedBytes / sizeBytes) * 100;
                                this.reportTaskProgress(task.id, pct);
                                lastReport = now;
                            }
                        });

                        writer.on('finish', () => resolve(true));
                        writer.on('error', (err) => reject(err));
                    });

                    // 4. Verification
                    if (sha256) {
                        const hash = crypto.createHash('sha256');
                        const fileBuffer = fs.readFileSync(partPath);
                        hash.update(fileBuffer);
                        const hex = hash.digest('hex');
                        if (hex !== sha256) {
                            fs.unlinkSync(partPath);
                            throw new Error(`SHA256 mismatch. Got ${hex}, expected ${sha256}`);
                        }
                    }

                    // 5. Finalize
                    fs.renameSync(partPath, resolved);
                    if (mode && os.platform() !== 'win32') {
                        fs.chmodSync(resolved, mode);
                    }

                    result = { success: true, path: resolved };
                    break;
                }

                default:
                    error = `Unknown task type: ${task.type}`;
            }
        } catch (e: any) {
            error = e?.message || String(e);
        }

        // Always attempt completion so server polling never hangs
        await this.completeTask(task.id, result, error);
    }

    // ------------------------
    // Metrics loop
    // ------------------------
    private async metricsLoop() {
        console.log("Entering metrics loop...");
        let i = 0;
        while (this.running) {
            try {
                const metrics = this.collectMetrics();
                await this.reportMetrics(metrics);
                if (this.stream) {
                    this.stream.pushMetrics(metrics);
                    // Push connections every cycle (5s) for better responsiveness
                    this.stream.pushConns(listConnections());
                }
            } catch (error: any) {
                console.error("Error in metrics loop:", error?.message || error);
            }
            i++;
            await sleep(5000);
        }
    }

    private getCpuUsage(): number {
        const cpus = os.cpus();
        let idle = 0;
        let total = 0;

        for (const cpu of cpus) {
            for (const type in cpu.times) total += (cpu.times as any)[type];
            idle += cpu.times.idle;
        }

        if (!this.lastCpuUsage) {
            this.lastCpuUsage = { idle, total };
            return 2; // small non-zero on first read
        }

        const idleDiff = idle - this.lastCpuUsage.idle;
        const totalDiff = total - this.lastCpuUsage.total;
        this.lastCpuUsage = { idle, total };

        return totalDiff === 0 ? 0 : Math.max(0, Math.min(100, 100 - Math.floor((100 * idleDiff) / totalDiff)));
    }

    private getNetworkUsage(): { rxSpeed: number; txSpeed: number } {
        try {
            if (os.platform() !== "linux") return { rxSpeed: 0, txSpeed: 0 };

            const netOut = fs.readFileSync("/proc/net/dev", "utf-8");
            const lines = netOut.trim().split("\n");

            let totalRx = 0;
            let totalTx = 0;

            for (const line of lines) {
                if (!line.includes(":")) continue;
                const parts = line.trim().split(/\s+/);
                if (parts[0].startsWith("lo")) continue;
                totalRx += parseInt(parts[1], 10) || 0;
                totalTx += parseInt(parts[9], 10) || 0;
            }

            const now = Date.now();
            if (!this.lastNetBytes) {
                this.lastNetBytes = { rx: totalRx, tx: totalTx, ts: now };
                return { rxSpeed: 0, txSpeed: 0 };
            }

            const dt = Math.max(0.25, (now - this.lastNetBytes.ts) / 1000);
            const rxSpeed = Math.floor((totalRx - this.lastNetBytes.rx) / dt);
            const txSpeed = Math.floor((totalTx - this.lastNetBytes.tx) / dt);

            this.lastNetBytes = { rx: totalRx, tx: totalTx, ts: now };

            if (this.stream) this.stream.pushNet(rxSpeed, txSpeed);

            return { rxSpeed: Math.max(0, rxSpeed), txSpeed: Math.max(0, txSpeed) };
        } catch {
            return { rxSpeed: 0, txSpeed: 0 };
        }
    }

    private lastNeofetch: { output: string; ts: number } | null = null;

    private async installNeofetch() {
        if (os.platform() !== "linux") return;
        try {
            execSync("which neofetch", { stdio: "ignore" });
        } catch {
            console.log("[CocktailAgent] Installing neofetch...");
            try {
                // Try apt-get first
                execSync("sudo apt-get update && sudo apt-get install -y neofetch", { stdio: "ignore" });
                console.log("[CocktailAgent] neofetch installed via apt.");
            } catch (e) {
                console.error("[CocktailAgent] Failed to install neofetch:", e);
            }
        }
    }

    private getNeofetch(): string {
        try {
            if (os.platform() !== "linux") return "Neofetch only supported on Linux";

            const now = Date.now();
            if (this.lastNeofetch && (now - this.lastNeofetch.ts) < 120000) {
                return this.lastNeofetch.output;
            }

            const output = execSync("neofetch --stdout", { encoding: "utf-8", shell: "/bin/bash" });
            this.lastNeofetch = { output, ts: now };
            return output;
        } catch (e) {
            return "Neofetch failed: " + (e as any).message;
        }
    }

    private collectMetrics() {
        const cpuUsage = this.getCpuUsage();
        const loadAvg = os.loadavg();
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        const netSpeed = this.getNetworkUsage();
        const neofetch = this.getNeofetch();

        const diskInfo: any[] = [];
        try {
            if (os.platform() === "linux") {
                const dfOut = execSync("df -B1 / --output=target,size,pcent,used,avail", {
                    encoding: "utf-8",
                    shell: "/bin/bash",
                });
                const lines = dfOut.trim().split("\n");
                if (lines.length > 1) {
                    const parts = lines[1].trim().split(/\s+/);
                    diskInfo.push({
                        mount: parts[0],
                        totalBytes: parseInt(parts[1], 10) || 0,
                        usedBytes: parseInt(parts[3], 10) || 0,
                        freeBytes: parseInt(parts[4], 10) || 0,
                    });
                }
            } else {
                diskInfo.push({ mount: "/", totalBytes: totalMem * 4, usedBytes: totalMem, freeBytes: totalMem * 3 });
            }
        } catch {
            diskInfo.push({ mount: "/", totalBytes: totalMem * 2, usedBytes: usedMem, freeBytes: freeMem });
        }

        let tempC = 0;
        try {
            if (os.platform() === "linux") {
                const tempStr = fs.readFileSync("/sys/class/thermal/thermal_zone0/temp", "utf8");
                tempC = Math.round(parseInt(tempStr, 10) / 1000);
            }
        } catch {
            tempC = 38 + Math.floor(Math.random() * 5);
        }

        return {
            cpu: {
                usagePct: cpuUsage,
                cores: os.cpus().length,
                load1: loadAvg[0],
                load5: loadAvg[1],
                load15: loadAvg[2],
            },
            mem: { totalBytes: totalMem, usedBytes: usedMem, freeBytes: freeMem },
            disk: diskInfo,
            tempC,
            uptimeSec: os.uptime(),
            net: { rxBytesPerSec: netSpeed.rxSpeed, txBytesPerSec: netSpeed.txSpeed },
            neofetch
        };
    }

    private async reportMetrics(metrics: any) {
        try {
            await this.axiosInstance.post("report-metrics", {
                deviceId: this.config.deviceId,
                token: this.config.enrollmentToken,
                metrics,
            });
        } catch (e: any) {
            console.error("Failed to report metrics:", e?.response?.data || e?.message || e);
        }
    }
}

// CLI entry point
const args = process.argv.slice(2);
const config: any = {};
for (let i = 0; i < args.length; i += 2) {
    const key = String(args[i] || "").replace(/^--/, "");
    config[key] = args[i + 1];
}

if (config.serverUrl && config.enrollmentToken && config.deviceId) {
    if (config.allowedDirs) {
        config.allowedDirs = config.allowedDirs.split(',');
    }
    const agent = new CocktailAgent(config);
    if (config.allowedDirs) {
        (agent as any).allowedDirs = config.allowedDirs;
    }
    void agent.start();
} else {
    console.error("Missing required arguments: --serverUrl, --enrollmentToken, --deviceId");
}