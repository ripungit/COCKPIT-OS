"use client";

import React from "react";
import { Monitor, Plus, ArrowRight, ChevronRight, Server } from "lucide-react";
import { motion } from "framer-motion";

interface Vps {
    id: string;
    name: string;
    host: string;
    username: string;
    status?: string;
}

interface DeviceSelectionModalProps {
    devices: Vps[];
    onSelect: (device: Vps) => void;
    onConfigureNew: () => void;
}

export function DeviceSelectionModal({ devices, onSelect, onConfigureNew }: DeviceSelectionModalProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-[480px] bg-black/30 border border-white/5 backdrop-blur-2xl rounded-[32px] p-8 shadow-[0_40px_100px_rgba(0,0,0,0.5)] flex flex-col"
        >
            <div className="mb-6 flex flex-col gap-2">
                <h1 className="text-[24px] font-semibold text-white tracking-tight">Select Device</h1>
                <p className="text-white/60 text-[15px]">Choose a device to continue or configure a new one.</p>
            </div>

            <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {devices.filter(d => d.status !== 'failed' && d.status !== 'enrolling').map((device) => (
                    <button
                        key={device.id}
                        onClick={() => onSelect(device)}
                        className="group w-full p-4 bg-white/5 hover:bg-white/5 rounded-2xl flex items-center justify-between transition-all duration-200 text-left"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-zinc-500/10 flex items-center justify-center group-hover:bg-zinc-500/20 transition-colors">
                                <Monitor className="w-5 h-5 text-white group-hover:text-white transition-colors" />
                            </div>
                            <div>
                                <div className="text-white font-medium text-[15px]">{device.name}</div>
                                <div className="text-white/40 text-[13px] font-mono">{device.host}</div>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-white/60 transition-colors group-hover:translate-x-0.5" />
                    </button>
                ))}
            </div>

            <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/5"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-black/40 px-2 text-white/40 backdrop-blur-xl">Or</span>
                </div>
            </div>

            <button
                onClick={onConfigureNew}
                className="w-full h-13 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 bg-white/5 text-white hover:bg-white/10"
            >
                <Plus className="w-5 h-5 opacity-70" />
                Configure New PC
            </button>
        </motion.div>
    );
}
