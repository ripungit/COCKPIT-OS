"use client";

import React, { useState, useEffect } from "react";
import { GlassInterface } from "@/components/common/glass-interface";
import { FileText, PenLine, Plus } from "lucide-react";
import { BASE_URL } from "@/lib/baseURL";

interface NoteWidgetProps {
    onClick?: () => void;
}



export function NoteWidget({ onClick }: NoteWidgetProps) {
    const [latestNote, setLatestNote] = useState<{ title: string; content: string } | null>(null);
    const [noteCount, setNoteCount] = useState(0);

    useEffect(() => {
        const fetchLatestNote = async () => {
            try {
                const res = await fetch(`${BASE_URL}/cockpit/notes`, { credentials: "include" });
                if (res.ok) {
                    const notes = await res.json();
                    setNoteCount(notes.length);
                    if (notes.length > 0) {
                        setLatestNote({ title: notes[0].title, content: notes[0].content });
                    }
                }
            } catch (e) {
                console.error("Failed to fetch notes:", e);
            }
        };
        fetchLatestNote();
    }, []);

    // Strip HTML tags for preview
    const stripHtml = (html: string) => {
        if (typeof document === "undefined") return html;
        const tmp = document.createElement("div");
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || "";
    };

    const previewContent = latestNote?.content ? stripHtml(latestNote.content).slice(0, 80) : "Tap to create your first note...";

    return (
        <GlassInterface
            className="!w-[210px] !h-[210px] !rounded-[2.5rem] !p-5 relative group cursor-pointer overflow-hidden active:scale-95 transition-transform"
            onClick={onClick}
        >
            {/* Icon */}
            <div className="absolute top-5 right-5 text-white">
                <FileText className="w-5 h-5" />
            </div>

            <div className="flex flex-col h-full justify-between relative z-10">
                <div className="flex flex-col gap-0.5">
                    <span className="text-[8px] font-black text-white uppercase tracking-[0.2em]">Notepad</span>
                    <h3 className="text-xl font-extrabold text-white leading-tight tracking-tight mt-1 group-hover:text-white transition-colors truncate pr-6">
                        {latestNote?.title || "No Notes"}
                    </h3>
                    {/* <span className="text-xs font-semibold text-white/60">
                        {noteCount > 0 ? `${noteCount} note${noteCount > 1 ? 's' : ''}` : 'Empty'}
                    </span> */}
                </div>

                <div className="space-y-4">
                    {/* Preview */}
                    <div className="space-y-2">
                        <div className="text-[11px] text-white/50 leading-relaxed line-clamp-3">
                            {previewContent}
                        </div>
                    </div>

                    {/* Action */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider">Quick Note</span>
                        </div>
                        <div className="w-8 h-8 ml-4 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center shadow-lg transform active:scale-90 transition-all">
                            {latestNote ? (
                                <PenLine className="w-3.5 h-3.5 text-white" />
                            ) : (
                                <Plus className="w-3.5 h-3.5 text-white" />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </GlassInterface>
    );
}
