"use client";

import { GlassInterface } from "@/components/common/glass-interface";
import "@/components/common/styles/glass-interface.css";
import {
    Search,
    Grid,
    Compass,
    MessageCircle,
    Mail,
    MapPin,
    Image as ImageIcon,
    Video,
    Phone,
    Calendar,
    User,
    List,
    Settings,
    Folder,
    Monitor,
    MonitorCogIcon,
    TriangleAlert,
    TriangleDashed,
    Activity,
    MailIcon,
    MailOpen,
    Images,
    Settings2,
    Calculator,
    Calendar1,
    Cloud,
    ExternalLink,
    X,
    Terminal,
    Music,
    Info
} from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
    SiGoogle,
    SiSafari,
    SiGooglemaps,
    SiGooglephotos,
    SiApple,
    SiGooglecalendar,
    SiIcloud,
    SiGmail,
    SiBrave
} from "@icons-pack/react-simple-icons";
import { useState } from "react";

const systemApps = [
    { icon: Terminal, label: "Terminal", color: "bg-white/10" },
    { icon: Folder, label: "Explorer", color: "bg-white/10" },
    { icon: Activity, label: "Task Monitor", color: "bg-white/10" },
];

// const commsApps = [
//     { icon: Video, label: "FaceTime", color: "bg-white/10" },
//     { icon: MailOpen, label: "Reglook Mail", color: "bg-white/10" },
// ];

const personalApps = [
    { icon: MailOpen, label: "Reglook Mail", color: "bg-white/10" },
    { icon: Calendar, label: "Calendar", color: "bg-white/10" },
    { icon: Images, label: "Photos", color: "bg-white/10" },
    // { icon: Music, label: "Music", color: "bg-white/10" },
    // { icon: Cloud, label: "xCloud", color: "bg-white/10" },
];

const webApps = [
    { icon: SiBrave, label: "Brave", color: "bg-white/10", url: "https://search.brave.com/" },
    { icon: SiGoogle, label: "Google", color: "bg-white/10", url: "https://google.com" },
];

export interface DockProps {
    onAppClick?: (label: string) => void;
    activeApps?: string[];
}

export function Dock({ onAppClick, activeApps = [] }: DockProps) {
    const [redirectModal, setRedirectModal] = useState<{ show: boolean; browser: string; url: string }>({
        show: false,
        browser: "",
        url: ""
    });

    const handleBrowserClick = (browser: string, url: string) => {
        setRedirectModal({ show: true, browser, url });
    };

    const handleProceed = () => {
        window.open(redirectModal.url, '_blank');
        setRedirectModal({ show: false, browser: "", url: "" });
    };

    const handleCancel = () => {
        setRedirectModal({ show: false, browser: "", url: "" });
    };

    return (
        <>
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
                <GlassInterface className="!px-2 !py-1 !rounded-[20px]">
                    <div className="flex items-end gap-2 px-2 py-0">
                        {/* System Info - Special case */}
                        <DockItem
                            icon={Info}
                            label="System Info"
                            className="bg-white/10 !text-blue-500"
                            onClick={() => onAppClick?.("Finder")}
                            isActive={activeApps.includes("Finder")}
                        />

                        <div className="w-[1px] h-8 bg-white/20 mx-1 self-center" />

                        {systemApps.map((item, index) => (
                            <DockItem
                                key={`sys-${index}`}
                                icon={item.icon}
                                label={item.label}
                                color={item.color}
                                onClick={() => onAppClick?.(item.label)}
                                isActive={activeApps.includes(item.label)}
                            />
                        ))}

                        {/* <div className="w-[1px] h-8 bg-white/20 mx-1 self-center" /> */}

                        {/* {commsApps.map((item, index) => (
                            <DockItem
                                key={`comm-${index}`}
                                icon={item.icon}
                                label={item.label}
                                color={item.color}
                                onClick={() => onAppClick?.(item.label)}
                                isActive={activeApps.includes(item.label)}
                            />
                        ))} */}

                        <div className="w-[1px] h-8 bg-white/20 mx-1 self-center" />

                        {personalApps.map((item, index) => (
                            <DockItem
                                key={`pers-${index}`}
                                icon={item.icon}
                                label={item.label}
                                color={item.color}
                                onClick={() => onAppClick?.(item.label)}
                                isActive={activeApps.includes(item.label)}
                            />
                        ))}

                        <div className="w-[1px] h-8 bg-white/20 mx-1 self-center" />

                        {webApps.map((item, index) => (
                            <DockItem
                                key={`web-${index}`}
                                icon={item.icon}
                                label={item.label}
                                color={item.color}
                                onClick={() => handleBrowserClick(item.label, item.url || "")}
                                isActive={activeApps.includes(item.label)}
                            />
                        ))}

                        <div className="w-[1px] h-8 bg-white/20 mx-1 self-center" />

                        <DockItem
                            icon={Settings2}
                            label="Settings"
                            color="bg-white/10"
                            onClick={() => onAppClick?.("Settings")}
                            isActive={activeApps.includes("Settings")}
                        />
                    </div>
                </GlassInterface>
            </div>

            {/* Browser Redirection Modal */}
            <AnimatePresence>
                {redirectModal.show && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm"
                        onClick={handleCancel}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative w-[480px] bg-zinc-950 border border-white/10 rounded-2xl p-8 backdrop-blur-3xl shadow-2xl"
                        >
                            {/* Close Button */}
                            <button
                                onClick={handleCancel}
                                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors group"
                            >
                                <X className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
                            </button>

                            {/* Icon */}
                            <div className="flex justify-center mb-6">
                                <div className="w-16 h-16 rounded-2xl bg-zinc-950 border border-zinc-500/20 flex items-center justify-center">
                                    <ExternalLink className="w-8 h-8 text-zinc-500" />
                                </div>
                            </div>

                            {/* Content */}
                            <div className="text-center space-y-4 mb-8">
                                <h2 className="text-2xl font-bold text-white">External Browser</h2>
                                <p className="text-[15px] text-zinc-400 leading-relaxed">
                                    You're about to enter <span className="font-bold text-white">{redirectModal.browser}</span> in a new browser tab. This will redirect you to an external page.
                                </p>
                                <div className="px-4 py-2 bg-zinc-900/50 rounded-lg border border-white/5">
                                    <p className="text-[13px] font-semibold text-zinc-500 truncate">{redirectModal.url}</p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    onClick={handleCancel}
                                    className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[15px] font-semibold text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleProceed}
                                    className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-[15px] font-semibold text-white transition-colors flex items-center justify-center gap-2"
                                >
                                    <span>Continue</span>
                                    <ExternalLink className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

function DockItem({
    icon: Icon,
    label,
    color,
    className = "",
    onClick,
    isActive
}: {
    icon: any,
    label: string,
    color?: string,
    className?: string,
    onClick?: () => void,
    isActive?: boolean
}) {
    return (
        <motion.div
            whileHover={{ scale: 1.2, y: -5 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClick}
            className="group relative"
        >
            <div className={`
                w-11 h-11 rounded-[10px] flex items-center justify-center 
                shadow-lg cursor-pointer transition-all duration-300
                ${color || "bg-white/10 hover:bg-white/20"}
                ${className}
            `}>
                {typeof Icon === 'string' ? (
                    <Image src={Icon} alt={label} width={38} height={38} className="w-12 h-12" />
                ) : (
                    <Icon className="w-6 h-6 text-white" />
                )}
            </div>

            {/* Active indicator dot */}
            {isActive && (
                <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.5)]" />
            )}

            {/* Tooltip */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/50 backdrop-blur-md text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {label}
            </div>
        </motion.div>
    );
}
