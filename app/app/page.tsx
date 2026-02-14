"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { GlassClock } from "@/components/common/clock";
import { StatusIndicators } from "@/components/common/status-indicators";
import { LockScreen } from "@/components/launcher/lock";

export default function Home() {
  const [isLocked, setIsLocked] = useState(true);
  const [pinVisible, setPinVisible] = useState(false);
  const router = useRouter();

  return (
    <>
      {/* Background & Cockpit Content (This blurs) */}
      <div
        className={`relative grid grid-rows-[auto_1fr_auto] items-start justify-items-center h-screen px-4 pb-12 font-[family-name:var(--font-geist-sans)] overflow-hidden transition-[filter,brightness,pointer-events] duration-300 ease-out ${isLocked && pinVisible ? "blur-[18px] brightness-75" : ""
          } ${isLocked ? "pointer-events-none select-none" : "pointer-events-auto"}`}
      >
        {/* Background Image */}
        <Image
          src="/wallpaper/12.jpg"
          alt="Cockpit Wallpaper"
          fill
          priority
          quality={100}
          unoptimized
          className="object-cover -z-10 opacity-100"
        />

        {/* Top Bar Layout */}
        <div className="absolute top-8 left-10 z-50">
          <Image
            src="/logo/reglook-logo.svg"
            alt="Reglook Logo"
            width={120}
            height={40}
            className="h-8 w-auto opacity-100 drop-shadow-md"
          />
        </div>

        <div className="absolute top-8 right-10 z-50">
          <StatusIndicators />
        </div>

        <main className="flex flex-col row-start-2 items-center text-white w-full">

          <div className="w-full flex justify-center mt-10">
            <GlassClock />
          </div>
        </main>

        {/* Ad Space Placeholder - Bottom Right */}
        {/* <div className="absolute bottom-8 right-10 z-50 group">
          <div className="w-64 h-24 bg-transparent border border-white/10 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-4 transition-all hover:bg-white/[0.08] hover:border-white/20 hover:scale-[1.02] cursor-pointer shadow-2xl">
            <div className="w-full h-full border border-dashed border-white/10 rounded-xl flex items-center justify-center relative overflow-hidden">
              <span className="text-[10px] font-bold tracking-[0.2em] text-white/20 uppercase">Promotion Space</span>
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </div> */}
      </div>

      {/* Security Overlay (Remains sharp on top) */}
      {isLocked && (
        <LockScreen
          onUnlock={() => {
            setIsLocked(false);
            setPinVisible(false);
            // Navigate to home page after unlock animation
            router.push('/home');
          }}
          onPinVisibleChange={(visible) => setPinVisible(visible)}
        />
      )}
    </>
  );
}
