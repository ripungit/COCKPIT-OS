"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Terminal as TerminalIcon, Monitor, User, Lock, Globe, ArrowRight, ChevronRight, CheckCircle2, Eye, EyeOff, Link2, Loader2, Sparkles, AlertCircle, PartyPopperIcon, Hash } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import "@xterm/xterm/css/xterm.css";

export function SetupForm() {
    const [mode, setMode] = useState<'new' | 'existing'>('new');
    const [showPassword, setShowPassword] = useState(false);
    const [status, setStatus] = useState<'idle' | 'connecting' | 'verifying' | 'enrolling' | 'installing' | 'success' | 'error'>('idle');
    const [failStage, setFailStage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState("");
    const [logs, setLogs] = useState<string[]>([]);
    const [formData, setFormData] = useState({
        pcName: "",
        host: "",
        port: 22,
        user: "root",
        password: "",
        deviceId: ""
    });
    const [suggestedPorts, setSuggestedPorts] = useState<number[]>([]);

    // Real Terminal Refs for background pipe
    const termRef = useRef<any>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll logic
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (termRef.current) termRef.current.dispose();
            if (wsRef.current) wsRef.current.close();
        };
    }, []);

    const addLog = (msg: string) => {
        setLogs(prev => [...prev, msg]);
    };

    const initTerminalPipe = async (vpsId: string, installCommand: string) => {
        try {
            const { Terminal } = await import("@xterm/xterm");
            // We use a virtual terminal to capture real output without the xterm UI
            const term = new Terminal();
            termRef.current = term;

            const res = await fetch(`http://localhost:9100/cockpit/vps/${vpsId}/terminal/sessions`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            });

            if (!res.ok) throw new Error("Terminal session failed");
            const { sessionId } = await res.json();

            const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
            const ws = new WebSocket(`${protocol}//${window.location.hostname}:9100/cockpit/terminal/ws?id=${sessionId}`);
            wsRef.current = ws;

            let shellReady = false;

            ws.onopen = () => {
                ws.send(JSON.stringify({ type: "init", cols: 120, rows: 40 }));

                // Send a Ctrl+C to wake up/clear the prompt
                setTimeout(() => {
                    ws.send(JSON.stringify({ type: "input", data: "\x03" }));
                }, 1000);
            };

            ws.onmessage = (event) => {
                const msg = JSON.parse(event.data);
                if (msg.type === "output") {
                    // Robust regex to strip ANSI escapes, including window titles and paste mode
                    const cleanData = msg.data.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]|(?:\x1B\]0;.*?\x07)/g, '');

                    const lines = cleanData.split(/\r?\n/);
                    lines.forEach((line: string) => {
                        const trimmed = line.trim();
                        // Only log lines that have content and aren't just redundant prompts
                        if (trimmed.length > 0 && !trimmed.match(/^\[\?2004[hl]$/)) {
                            // Check if this looks like a prompt and we haven't sent the command yet
                            if (!shellReady && (trimmed.endsWith("#") || trimmed.endsWith("$") || trimmed.includes(":~#"))) {
                                shellReady = true;
                                setTimeout(() => {
                                    ws.send(JSON.stringify({ type: "input", data: installCommand + "\r" }));
                                }, 800);
                            }
                            addLog(trimmed);
                        }
                    });
                }
                if (msg.type === "exit") {
                    setStatus('success');
                }
            };

        } catch (err: any) {
            setFailStage('installing');
            const msg = err.message || "Terminal connection failed";
            setErrorMessage(msg);
            addLog(`✖ Terminal Error: ${msg}`);
            setStatus('error');
        }
    };

    const handleConnect = async () => {
        if (status !== 'idle' && status !== 'error') return;

        try {
            setFailStage(null);
            setErrorMessage("");
            setSuggestedPorts([]);
            setStatus('connecting');
            setLogs([]);

            // Step 1: Create VPS
            const vpsRes = await fetch("http://localhost:9100/cockpit/vps", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.pcName,
                    host: formData.host,
                    port: formData.port || 22,
                    username: formData.user,
                    password: formData.password
                }),
                credentials: "include"
            });

            if (!vpsRes.ok) throw new Error("Failed to create VPS entry");
            const vps = await vpsRes.json();
            const vpsId = vps.id;

            // Step 2: Verify
            setStatus('verifying');
            const verifyRes = await fetch(`http://localhost:9100/cockpit/vps/${vpsId}/verify`, {
                method: "POST",
                credentials: "include"
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok || !verifyData.ok) {
                // Check for SSH_PORT_MISMATCH
                if (verifyData.code === 'SSH_PORT_MISMATCH' && verifyData.suggestedPorts) {
                    setSuggestedPorts(verifyData.suggestedPorts);
                    setErrorMessage(verifyData.message);
                    setFailStage('verifying');
                    setStatus('error');
                    addLog(`⚠ ${verifyData.message}`);
                    return; // Stop here
                }
                throw new Error(verifyData.message || "Verification failed");
            }

            // Step 3: Enroll
            setStatus('enrolling');
            const enrollRes = await fetch(`http://localhost:9100/cockpit/cocktail/devices/enroll/start`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ vpsId }),
                credentials: "include"
            });

            if (!enrollRes.ok) throw new Error("Enrollment failed");
            const enrollData = await enrollRes.json();

            // Step 4: Real Terminal Pipe
            setStatus('installing');
            let fullCommand = enrollData.installCommand || "";
            // Ensure ws is installed if not already in the command
            if (fullCommand && !fullCommand.includes("npm install -g ws")) {
                fullCommand += " && sudo npm install -g ws";
            }
            // Automatically exit SSH when command finishes
            fullCommand += " && exit";

            initTerminalPipe(vpsId, fullCommand);

        } catch (err: any) {
            setFailStage(status);
            const msg = err.message || "An unexpected error occurred";
            setErrorMessage(msg);
            addLog(`✖ ERROR: ${msg}`);
            setStatus('error');
        }
    };

    const isFormValid = mode === 'new'
        ? (formData.pcName && formData.host && formData.user && formData.password)
        : formData.deviceId;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-[1000px] h-[640px] bg-[#fff]/5 rounded-[32px] shadow-[0_40px_100px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col md:flex-row border border-white/5"
        >
            {/* Left Side: Form */}
            <div className="flex-1 bg-transparent p-12 flex flex-col justify-between">
                <AnimatePresence mode="wait">
                    {status === 'success' ? (
                        <motion.div
                            key="success-screen"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center h-full text-center space-y-6 py-12"
                        >
                            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-4">
                                <PartyPopperIcon className="w-10 h-10 text-white" />
                            </div>
                            <div className="space-y-2">
                                <h1 className="text-[32px] font-semibold text-white tracking-tight">Setup Complete</h1>
                                <p className="text-[17px] text-white/60 font-normal leading-relaxed max-w-[320px]">
                                    Your device <span className="text-white font-medium">{formData.pcName}</span> is now connected and synchronized with Cockpit.
                                </p>
                            </div>
                            <button
                                onClick={() => window.location.href = '/home'}
                                className="group px-10 py-4 bg-white text-black rounded-full font-bold text-[16px] hover:bg-white/90 transition-all shadow-xl shadow-white/10 flex items-center gap-2"
                            >
                                Get Started
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </motion.div>
                    ) : mode === 'new' ? (
                        <motion.div
                            key="new-device"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="space-y-8"
                        >
                            <div className="space-y-2">
                                <h1 className="text-[32px] font-semibold text-[#fff] tracking-tight">Configure your PC</h1>
                                <p className="text-[17px] text-[#fff] font-normal leading-relaxed">Enter your VPS details to start the connection process.</p>
                            </div>

                            <div className="space-y-5">
                                <div className="space-y-3">
                                    <label className="text-[13px] font-semibold text-[#fff] ml-1 uppercase tracking-wider opacity-100">PC Name</label>
                                    <div className="relative group mt-1">
                                        <Monitor strokeWidth={2.5} className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#fff] transition-colors group-focus-within:text-[#fff]" />
                                        <input
                                            type="text"
                                            placeholder="e.g. My VPS"
                                            className="w-full text-white font-medium h-12 bg-[#fff]/10 border border-transparent rounded-xl pl-11 pr-4 text-[15px] focus:bg-white/10 focus:border-[#fff]/10 focus:ring-1 focus:ring-[#fff]/10 transition-all outline-none"
                                            value={formData.pcName}
                                            onChange={(e) => setFormData({ ...formData, pcName: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-[1fr_180px] gap-4 items-end">                                    {/* Public IP */}
                                    <div className="space-y-3">
                                        <label className="text-[13px] font-semibold text-[#fff] ml-1 uppercase tracking-wider">
                                            Public IP Address
                                        </label>
                                        <div className="relative group mt-1">
                                            <Globe
                                                strokeWidth={2.5}
                                                className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#fff]"
                                            />
                                            <input
                                                type="text"
                                                placeholder="e.g. 192.168.1.1"
                                                className="w-full text-white font-medium h-12 bg-[#fff]/10 border border-transparent rounded-xl pl-11 pr-4 text-[15px] focus:bg-white/10 focus:border-[#fff]/10 focus:ring-1 focus:ring-[#fff]/10 transition-all outline-none"
                                                value={formData.host}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, host: e.target.value })
                                                }
                                            />
                                        </div>
                                    </div>

                                    {/* Port */}
                                    <div className="space-y-3">
                                        <label className="text-[13px] font-semibold text-[#fff] ml-1 uppercase tracking-wider">
                                            Port
                                        </label>
                                        <div className="relative group mt-1">
                                            <Hash
                                                strokeWidth={2.5}
                                                className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#fff]"
                                            />
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                placeholder="22"
                                                className="w-full text-white font-medium h-12 bg-[#fff]/10 border border-transparent rounded-xl pl-11 pr-4 text-[15px] focus:bg-white/10 focus:border-[#fff]/10 focus:ring-1 focus:ring-[#fff]/10 transition-all outline-none"
                                                value={formData.port}
                                                onChange={(e) => {
                                                    const onlyDigits = e.target.value.replace(/\D/g, "");
                                                    const n = onlyDigits === "" ? "" : Math.min(65535, Math.max(1, Number(onlyDigits)));

                                                    setFormData({
                                                        ...formData,
                                                        port: n as any
                                                    });
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                                {/* <div className="ml-1 -mt-2 text-[11px] text-white/40">
                                    If your server uses a custom SSH port, enter it here.
                                </div> */}

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                        <label className="text-[13px] font-semibold text-[#fff] ml-1 uppercase tracking-wider opacity-100">User</label>
                                        <div className="relative group mt-1">
                                            <User strokeWidth={2.5} className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#fff] transition-colors group-focus-within:text-[#fff]" />
                                            <input
                                                type="text"
                                                className="w-full text-white font-medium h-12 bg-[#fff]/10 border border-transparent rounded-xl pl-11 pr-4 text-[15px] focus:bg-white/10 focus:border-[#fff]/10 focus:ring-1 focus:ring-[#fff]/10 transition-all outline-none"
                                                value={formData.user}
                                                onChange={(e) => setFormData({ ...formData, user: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[13px] font-semibold text-[#fff] ml-1 uppercase tracking-wider opacity-100">Password</label>
                                        <div className="relative group mt-1">
                                            <Lock strokeWidth={2.5} className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#fff] transition-colors group-focus-within:text-[#fff]" />
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                className="w-full text-white font-medium h-12 bg-[#fff]/10 border border-transparent rounded-xl pl-11 pr-12 text-[15px] focus:bg-white/10 focus:border-[#fff]/10 focus:ring-1 focus:ring-[#fff]/10 transition-all outline-none"
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-white/80 transition-colors"
                                            >
                                                {showPassword ? (
                                                    <EyeOff strokeWidth={2.5} className="w-4 h-4" />
                                                ) : (
                                                    <Eye strokeWidth={2.5} className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="existing-device"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="space-y-8"
                        >
                            <div className="space-y-2">
                                <h1 className="text-[32px] font-semibold text-[#fff] tracking-tight">Sign in with your device</h1>
                                <p className="text-[17px] text-[#fff] font-normal leading-relaxed">We've already sent your setup link to your registered email during the first-time setup.</p>
                            </div>

                            <div className="space-y-5">
                                <div className="space-y-3">
                                    <label className="text-[13px] font-semibold text-[#fff] ml-1 uppercase tracking-wider opacity-100">Device ID</label>
                                    <div className="relative group mt-1">
                                        <Monitor strokeWidth={2.5} className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#fff] transition-colors group-focus-within:text-[#fff]" />
                                        <input
                                            type="text"
                                            placeholder=""
                                            className="w-full text-white font-medium h-12 bg-[#fff]/10 border border-transparent rounded-xl pl-11 pr-4 text-[15px] focus:bg-white/10 focus:border-[#fff]/10 focus:ring-1 focus:ring-[#fff]/10 transition-all outline-none font-mono"
                                            value={formData.deviceId}
                                            onChange={(e) => setFormData({ ...formData, deviceId: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {status !== 'success' && (
                    <div className="flex items-center justify-between pt-6 border-t border-white/10">
                        <button
                            onClick={() => setMode(mode === 'new' ? 'existing' : 'new')}
                            className="text-[13px] text-[#fff] hover:underline flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                        >
                            <CheckCircle2 className="w-4 h-4 text-[#fff]" />
                            {mode === 'new' ? "Already have a device?" : "Setup new device?"}
                        </button>
                        <button
                            onClick={handleConnect}
                            disabled={!isFormValid || (status !== 'idle' && status !== 'error')}
                            className={`group px-6 py-3 rounded-full font-semibold text-[15px] flex items-center gap-2 transition-all duration-300 ${isFormValid && (status === 'idle' || status === 'error')
                                ? "bg-[#fff] text-black hover:bg-[#fff]/90 cursor-pointer shadow-lg shadow-[#fff]/20"
                                : "bg-[#F5F5F7]/10 text-[#fff]/30 cursor-not-allowed"
                                }`}
                        >
                            {status === 'idle' ? (mode === 'new' ? "Connect Device" : "Add Device") : status === 'error' ? "Retry Connection" : "Connecting..."}
                            {(status === 'idle' || status === 'error') && <ChevronRight className={`w-4 h-4 transition-transform group-hover:translate-x-1`} />}
                            {status !== 'idle' && status !== 'error' && (
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                    className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full"
                                />
                            )}
                        </button>
                    </div>
                )}
            </div>

            {/* Right Side: Log-Integrated Feed */}
            <div className="w-full md:w-[440px] flex-none bg-black p-10 relative flex flex-col font-mono border-l border-white/5">
                {/* Decoration */}
                <div className="absolute top-8 left-8 w-2 h-2 border-t border-l border-white/20" />
                <div className="absolute top-8 right-8 w-2 h-2 border-t border-r border-white/20" />
                <div className="absolute bottom-8 left-8 w-2 h-2 border-b border-l border-white/20" />
                <div className="absolute bottom-8 right-8 w-2 h-2 border-b border-r border-white/20" />

                <div className="flex gap-1.5 mb-8 relative z-10">
                    <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                    <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                    <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                </div>

                <div className="flex-1 text-[13px] space-y-4 relative z-10 overflow-hidden flex flex-col">
                    {/* RESTORED HEADER: SSH */}
                    <div className="flex gap-2.5 items-center flex-none">
                        <span className="text-white/40 select-none">&gt;</span>
                        <span className="text-white bg-white/10 px-1.5 py-0.5 rounded text-[11px] font-bold">SSH</span>
                        <span className="text-white/50 font-medium tracking-tight">
                            ssh {formData.port !== 22 ? `-p ${formData.port} ` : ''}{formData.user || "root"}@{formData.host || "host"}
                        </span>
                    </div>

                    {/* Connection Progress Timeline */}
                    {status !== 'idle' && (
                        <div className="pl-5 space-y-4 flex-none border-l border-white/10 ml-0.5">
                            {[
                                { id: 'verifying', label: 'SSH Handshake', key: ['connecting', 'verifying'] },
                                { id: 'enrolling', label: 'Device Enrollment', key: ['enrolling'] },
                                { id: 'installing', label: 'CockpitOS Installation', key: ['installing', 'success'] }
                            ].map((stage, i) => {
                                const isActive = stage.key.includes(status);
                                const isDone = status === 'success' ||
                                    (i === 0 && !['connecting', 'verifying', 'idle', 'error'].includes(status)) ||
                                    (i === 1 && !['connecting', 'verifying', 'enrolling', 'idle', 'error'].includes(status));
                                const isFailed = status === 'error' && (stage.id === failStage || (failStage === 'connecting' && i === 0));

                                return (
                                    <motion.div
                                        key={stage.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="flex flex-col gap-1.5"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="relative flex items-center justify-center">
                                                {isFailed ? (
                                                    <AlertCircle className="w-4 h-4 text-[#FF3B30]" />
                                                ) : isDone ? (
                                                    <CheckCircle2 className="w-4 h-4 text-white" />
                                                ) : isActive ? (
                                                    <motion.div
                                                        animate={{ rotate: 360 }}
                                                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                                    >
                                                        <Loader2 className="w-4 h-4 text-white/60" />
                                                    </motion.div>
                                                ) : (
                                                    <div className="w-4 h-4 rounded-full border border-white/20" />
                                                )}
                                            </div>
                                            <span className={`text-[13px] font-medium transition-colors duration-300 ${isFailed ? 'text-[#FF3B30]' : isActive || isDone ? 'text-white' : 'text-white/30'}`}>
                                                {isFailed && stage.id === 'verifying' && errorMessage.toLowerCase().includes('mismatch')
                                                    ? 'Handshake Mismatch'
                                                    : stage.label}
                                            </span>
                                        </div>
                                        {isFailed && errorMessage && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                className="pl-7 overflow-hidden"
                                            >
                                                <div className="text-[11px] text-[#FF3B30]/70 font-mono bg-[#FF3B30]/5 border border-[#FF3B30]/10 px-2 py-1 rounded max-w-[300px]">
                                                    {errorMessage}
                                                </div>
                                            </motion.div>
                                        )}
                                        {isFailed && suggestedPorts.length > 0 && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                className="pl-7 pt-2 flex gap-2"
                                            >
                                                {suggestedPorts.map(p => (
                                                    <button
                                                        key={p}
                                                        onClick={() => {
                                                            setFormData({ ...formData, port: p });
                                                            setSuggestedPorts([]);
                                                            handleConnect();
                                                        }}
                                                        className="text-[11px] px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-md transition-colors"
                                                    >
                                                        Try Port {p}
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}

                    {/* RESTORED HEADER: DEVICE LABEL */}
                    {formData.pcName && (
                        <div className="pl-5 space-y-1 flex-none">
                            <div className="text-white/40 text-[11px] uppercase tracking-widest">Device Label</div>
                            <div className="text-white font-medium">{formData.pcName}</div>
                        </div>
                    )}

                    {/* Combined Logs: API + REAL TERMINAL PIPE */}
                    <div
                        ref={scrollRef}
                        className="pl-5 space-y-1 mt-4 overflow-y-auto no-scrollbar flex-1"
                    >
                        <AnimatePresence>
                            {logs.map((log, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -5 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className={`text-[12px] whitespace-pre-wrap leading-relaxed ${(log.startsWith('root@') || log.startsWith('$') || log.includes(':~#')) ? 'text-white' : 'text-white/60'
                                        }`}
                                >
                                    {log}
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        <div className="pt-2">
                            {status !== 'success' && status !== 'error' && (
                                <motion.div
                                    animate={{ opacity: [0, 1, 0] }}
                                    transition={{ repeat: Infinity, duration: 1 }}
                                    className="w-2 h-4 bg-white/40"
                                />
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-auto pt-8 flex justify-between items-center border-t border-white/5 opacity-40 relative z-10">
                    <div className="text-[10px] font-mono text-white/40 tracking-tighter">SSH-2.0-OpenSSH_9.0_Cockpit</div>
                    <div className="flex gap-1.5">
                        <div className="w-1 h-1 rounded-full bg-white/40" />
                        <div className="w-1 h-1 rounded-full bg-white/10" />
                        <div className="w-1 h-1 rounded-full bg-white/10" />
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
