"use client";

import { Wrench, ShieldAlert } from "lucide-react";

export default function MaintenancePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-textMain px-4 text-center">
      <div className="glass-panel p-8 max-w-md w-full space-y-6 border border-primary/30 shadow-[0_0_50px_rgba(139,92,246,0.2)]">
        <div className="p-4 bg-yellow-500/20 text-yellow-400 rounded-full w-20 h-20 mx-auto flex items-center justify-center animate-bounce">
          <Wrench className="w-10 h-10" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tight">SEDANG MAINTENANCE</h1>
          <p className="text-xs text-textMuted leading-relaxed">
            Tim <strong className="text-white">DUO CHAOS</strong> sedang melakukan rombakan besar-besaran dan peningkatan sistem di server. Arena game untuk sementara ditutup!
          </p>
        </div>

        <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-xs text-secondary font-mono">
          🚀 Segera kembali dengan fitur yang lebih gokil!
        </div>
      </div>
    </div>
  );
}