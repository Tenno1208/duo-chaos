"use client";

import { useEffect, useState } from "react";
import { Wrench, Clock, ShieldAlert, Sparkles, Gamepad2 } from "lucide-react";

export default function MaintenancePage() {
  // Menghitung tenggat waktu 3 hari kedepan dari sekarang secara otomatis
  const [timeLeft, setTimeLeft] = useState({ days: 3, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    // Target waktu: 3 hari dari sekarang
    const targetDate = new Date().getTime() + 3 * 24 * 60 * 60 * 1000;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a061e] text-textMain px-4 overflow-hidden">
      {/* BACKGROUND GLOW ORNAMENTS */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-secondary/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="glass-panel p-8 md:p-10 max-w-lg w-full space-y-6 text-center border border-primary/40 shadow-[0_0_60px_rgba(139,92,246,0.3)] relative z-10">
        
        {/* LOGO / ICON */}
        <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-primary/30 to-accent/20 rounded-3xl border border-primary/40 shadow-[0_0_30px_rgba(139,92,246,0.5)] mx-auto animate-pulse">
          <Gamepad2 className="w-12 h-12 text-primary" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 rounded-full text-xs font-bold uppercase tracking-widest">
            <Wrench className="w-3.5 h-3.5 animate-spin" /> System Maintenance
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">
            DUO <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-secondary">CHAOS</span> KEMBALI SEGERA!
          </h1>
          <p className="text-xs md:text-sm text-textMuted leading-relaxed">
            Tim developer sedang merombak total performa server, menambahkan fitur gokil, dan membersihkan bug demi pengalaman mabar yang maksimal.
          </p>
        </div>

        {/* COUNTDOWN TIMER 3 HARI */}
        <div className="space-y-2 pt-2">
          <span className="text-[10px] text-textMuted uppercase font-bold tracking-widest flex items-center justify-center gap-1">
            <Clock className="w-3 h-3 text-secondary" /> Estimasi Arena Dibuka Kembali
          </span>
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-white/5 border border-white/10 p-3 rounded-2xl">
              <span className="text-xl md:text-2xl font-black text-white">{timeLeft.days}</span>
              <span className="text-[10px] text-textMuted block uppercase font-bold">Hari</span>
            </div>
            <div className="bg-white/5 border border-white/10 p-3 rounded-2xl">
              <span className="text-xl md:text-2xl font-black text-secondary">{timeLeft.hours}</span>
              <span className="text-[10px] text-textMuted block uppercase font-bold">Jam</span>
            </div>
            <div className="bg-white/5 border border-white/10 p-3 rounded-2xl">
              <span className="text-xl md:text-2xl font-black text-accent">{timeLeft.minutes}</span>
              <span className="text-[10px] text-textMuted block uppercase font-bold">Menit</span>
            </div>
            <div className="bg-white/5 border border-white/10 p-3 rounded-2xl">
              <span className="text-xl md:text-2xl font-black text-yellow-400">{timeLeft.seconds}</span>
              <span className="text-[10px] text-textMuted block uppercase font-bold">Detik</span>
            </div>
          </div>
        </div>

        <div className="p-3 bg-primary/10 border border-primary/20 rounded-2xl text-xs text-secondary font-medium flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 text-accent shrink-0" /> Siapkan diri kalian untuk kekacauan baru!
        </div>

      </div>
    </div>
  );
}