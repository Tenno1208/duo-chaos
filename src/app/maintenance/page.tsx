"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Gamepad2,
  Sparkles,
  Zap,
  Swords,
  Trophy,
  ServerCog,
  Bell,
  Check,
  Loader2,
  Target,
  ChevronDown,
  ArrowRight,
  Flame,
} from "lucide-react";

/**
 * ============ KONFIGURASI ============
 * Atur waktu selesai lewat .env:
 * NEXT_PUBLIC_MAINTENANCE_END="2026-10-31T12:00:00+07:00"
 * NEXT_PUBLIC_MAINTENANCE_START="2026-10-28T00:00:00+07:00" (OPSIONAL: Untuk kalkulasi progress bar absolut)
 *
 * Jika kosong: 3 hari sejak kunjungan pertama (tersimpan, tidak reset saat refresh).
 */
const DEFAULT_DURATION_MS = 3 * 24 * 60 * 60 * 1000;
const END_ENV = process.env.NEXT_PUBLIC_MAINTENANCE_END;
const START_ENV = process.env.NEXT_PUBLIC_MAINTENANCE_START; // Tambahan untuk progress manual dari env

const STORAGE = {
  start: "dc_maint_start",
  end: "dc_maint_end",
  email: "dc_maint_email",
  best: "dc_maint_best",
};

const safeGet = (k: string) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const safeSet = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v);
  } catch {
    /* abaikan */
  }
};
const pad = (n: number) => String(n).padStart(2, "0");

const STEPS = [
  { label: "Migrasi ke server baru", state: "done" },
  { label: "Optimasi matchmaking & latency", state: "done" },
  { label: "Balancing arena & pembersihan bug", state: "active" },
  { label: "Peluncuran fitur baru", state: "todo" },
] as const;

const FEATURES = [
  { icon: Swords, title: "Mode Arena Baru", desc: "Duel dengan aturan acak di setiap ronde." },
  { icon: Trophy, title: "Leaderboard Musiman", desc: "Naik peringkat, rebut hadiah eksklusif." },
  { icon: Zap, title: "Power-Up Chaos", desc: "Kemampuan spesial yang membalik keadaan." },
  { icon: ServerCog, title: "Server Lebih Ngebut", desc: "Lag turun drastis, mabar makin mulus." },
];

/* =========================================================
 * KOMPONEN UTAMA
 * ========================================================= */
export default function MaintenancePage() {
  const [mounted, setMounted] = useState(false);
  const [range, setRange] = useState({ start: 0, end: 0 });
  const [now, setNow] = useState(0);

  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [gameOpen, setGameOpen] = useState(false);

  useEffect(() => {
    const current = Date.now();
    let start = Number(safeGet(STORAGE.start));
    let end = Number(safeGet(STORAGE.end));

    // Ambil waktu absolut dari ENV jika ada, ini bikin progress bar merujuk pada server bukan lokal user
    if (END_ENV) {
      const parsedEnd = new Date(END_ENV).getTime();
      if (!Number.isNaN(parsedEnd)) {
        end = parsedEnd;
        safeSet(STORAGE.end, String(end));
      }
    }
    
    if (START_ENV) {
      const parsedStart = new Date(START_ENV).getTime();
      if (!Number.isNaN(parsedStart)) {
        start = parsedStart;
        safeSet(STORAGE.start, String(start));
      }
    }

    if (!start) {
      start = current;
      safeSet(STORAGE.start, String(start));
    }
    if (!end) {
      end = start + DEFAULT_DURATION_MS;
      safeSet(STORAGE.end, String(end));
    }

    setRange({ start, end });
    setNow(current);
    setMounted(true);

    const saved = safeGet(STORAGE.email);
    if (saved) {
      setEmail(saved);
      setSubscribed(true);
    }

    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const diff = Math.max(range.end - now, 0);
  const finished = mounted && diff === 0;

  const time = useMemo(
    () => ({
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
    }),
    [diff]
  );

  const progress = useMemo(() => {
    const total = range.end - range.start;
    if (!mounted || total <= 0) return 0;
    return Math.min(Math.max(((now - range.start) / total) * 100, 0), 100);
  }, [mounted, now, range]);

  const submitEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Format email belum valid.");
      return;
    }
    setEmailError("");
    safeSet(STORAGE.email, email);
    setSubscribed(true);
  };

  return (
    <div className="dc-root fixed inset-0 z-50 overflow-y-auto overflow-x-hidden bg-[#07041a] text-white">
      <style>{CSS}</style>

      <NetworkCanvas />

      {/* AURORA */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="dc-aurora dc-a1" />
        <div className="dc-aurora dc-a2" />
        <div className="dc-aurora dc-a3" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, transparent 40%, rgba(7,4,26,.85) 100%)",
          }}
        />
      </div>

      <main
        className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-xl flex-col items-center px-4 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-6 sm:pt-14"
      >
        {/* STATUS PILL */}
        <div className="dc-rise inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-[11px] font-medium tracking-[0.18em] text-white/70 uppercase backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400/70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
          </span>
          {finished ? "Hampir selesai" : "Maintenance berlangsung"}
        </div>

        {/* LOGO + PROGRESS RING */}
        <div className="dc-rise mt-8 sm:mt-10" style={{ animationDelay: ".08s" }}>
          <ProgressLogo progress={progress} mounted={mounted} />
        </div>

        {/* JUDUL */}
        <h1
          className="dc-rise mt-6 text-center font-black leading-[0.95] tracking-tight"
          style={{ animationDelay: ".16s", fontSize: "clamp(2.6rem, 13vw, 5rem)" }}
        >
          DUO <span className="dc-gradient-text">CHAOS</span>
        </h1>
        <p
          className="dc-rise mt-3 text-center font-light tracking-wide text-white/90"
          style={{ animationDelay: ".22s", fontSize: "clamp(1.05rem, 4.6vw, 1.5rem)" }}
        >
          {finished ? "Arena segera dibuka." : "Kembali lebih gila."}
        </p>
        <p
          className="dc-rise mt-3 max-w-sm text-center text-[13px] leading-relaxed text-white/50 sm:text-sm"
          style={{ animationDelay: ".28s" }}
        >
          Kami sedang merombak performa server, menghadirkan fitur baru, dan
          membasmi bug demi pengalaman mabar terbaik.
        </p>

        {/* COUNTDOWN */}
        <section
          aria-label="Hitung mundur"
          className="dc-rise mt-9 w-full sm:mt-11"
          style={{ animationDelay: ".34s" }}
        >
          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            {[
              { v: time.days, l: "Hari" },
              { v: time.hours, l: "Jam" },
              { v: time.minutes, l: "Menit" },
              { v: time.seconds, l: "Detik" },
            ].map((t, i) => (
              <div
                key={t.l}
                className="dc-cell relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] py-3.5 text-center backdrop-blur-md sm:py-5"
              >
                <span
                  key={mounted ? t.v : "x"}
                  className={`${i === 3 ? "dc-tick" : ""} block font-mono font-semibold tabular-nums leading-none`}
                  style={{ fontSize: "clamp(1.6rem, 9vw, 2.9rem)" }}
                >
                  {mounted ? pad(t.v) : "--"}
                </span>
                <span className="mt-2 block text-[9px] font-medium tracking-[0.2em] text-white/40 uppercase sm:text-[10px]">
                  {t.l}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* TIMELINE */}
        <section
          className="dc-rise mt-10 w-full rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md sm:mt-12 sm:p-6"
          style={{ animationDelay: ".4s" }}
        >
          <h2 className="mb-4 text-[11px] font-medium tracking-[0.2em] text-white/40 uppercase">
            Status pengerjaan
          </h2>
          <ol className="relative space-y-4">
            <span
              aria-hidden
              className="absolute top-2 bottom-2 left-[9px] w-px bg-gradient-to-b from-violet-400/60 via-white/10 to-white/5"
            />
            {STEPS.map((s) => (
              <li key={s.label} className="relative flex items-center gap-3.5">
                <span
                  className={`relative z-10 flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full border ${
                    s.state === "done"
                      ? "border-emerald-400/60 bg-emerald-400/15 text-emerald-300"
                      : s.state === "active"
                      ? "border-amber-400/70 bg-amber-400/15 text-amber-300"
                      : "border-white/15 bg-[#07041a] text-transparent"
                  }`}
                >
                  {s.state === "done" && <Check className="h-3 w-3" strokeWidth={3} />}
                  {s.state === "active" && <Loader2 className="h-3 w-3 animate-spin" />}
                </span>
                <span
                  className={`text-[13px] sm:text-sm ${
                    s.state === "active"
                      ? "font-semibold text-white"
                      : s.state === "done"
                      ? "text-white/50"
                      : "text-white/35"
                  }`}
                >
                  {s.label}
                </span>
              </li>
            ))}
          </ol>
        </section>

        {/* FITUR BARU */}
        <section className="dc-rise mt-10 w-full sm:mt-12" style={{ animationDelay: ".46s" }}>
          <h2 className="mb-4 flex items-center justify-center gap-2 text-[11px] font-medium tracking-[0.2em] text-white/40 uppercase">
            <Sparkles className="h-3.5 w-3.5 text-violet-300" /> Yang akan hadir
          </h2>
          <div className="dc-scroll -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0">
            {FEATURES.map((f) => (
              <SpotCard key={f.title} className="w-[76%] shrink-0 snap-center sm:w-auto">
                <div className="mb-3 inline-flex rounded-xl border border-violet-400/25 bg-violet-400/10 p-2.5">
                  <f.icon className="h-4 w-4 text-violet-200" />
                </div>
                <p className="text-sm font-semibold text-white">{f.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-white/50">{f.desc}</p>
              </SpotCard>
            ))}
          </div>
        </section>

        {/* NOTIFY */}
        <section
          className="dc-rise mt-10 w-full rounded-3xl border border-violet-400/20 bg-gradient-to-b from-violet-500/[0.12] to-transparent p-5 sm:mt-12 sm:p-6"
          style={{ animationDelay: ".52s" }}
        >
          {subscribed ? (
            <div className="dc-pop flex items-start gap-3 text-sm text-white/80">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              </span>
              <span>
                Siap! Kami kabari ke <b className="break-all text-white">{email}</b>{" "}
                begitu arena dibuka.
              </span>
            </div>
          ) : (
            <form onSubmit={submitEmail} noValidate>
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <Bell className="h-4 w-4 text-violet-300" /> Kabari aku saat sudah buka
              </p>
              <div className="flex flex-col gap-2.5 sm:flex-row">
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="emailkamu@contoh.com"
                  aria-label="Email untuk notifikasi"
                  className="h-12 min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/30 px-4 text-base text-white outline-none transition placeholder:text-white/25 focus:border-violet-400/60 focus:bg-black/40"
                />
                <button
                  type="submit"
                  className="group inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 text-sm font-semibold text-white shadow-[0_8px_30px_-8px_rgba(139,92,246,.8)] transition active:scale-[0.97]"
                >
                  Beritahu aku
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </button>
              </div>
              {emailError && <p className="mt-2 text-xs text-rose-300">{emailError}</p>}
            </form>
          )}
        </section>

        {/* GAME (collapsible) */}
        <section className="dc-rise mt-6 w-full" style={{ animationDelay: ".58s" }}>
          <button
            onClick={() => setGameOpen((o) => !o)}
            aria-expanded={gameOpen}
            className="flex h-12 w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-5 text-sm text-white/70 backdrop-blur-md transition hover:bg-white/[0.06] active:scale-[0.99]"
          >
            <span className="flex items-center gap-2.5">
              <Gamepad2 className="h-4 w-4 text-violet-300" />
              Bosan menunggu? Main dulu
            </span>
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-300 ${gameOpen ? "rotate-180" : ""}`}
            />
          </button>
          <div
            className="grid transition-[grid-template-rows] duration-500 ease-out"
            style={{ gridTemplateRows: gameOpen ? "1fr" : "0fr" }}
          >
            <div className="overflow-hidden">
              <div className="pt-3">{gameOpen && <ChaosCatcher />}</div>
            </div>
          </div>
        </section>

        <p className="mt-10 text-center text-[11px] tracking-wide text-white/25">
          Terima kasih sudah sabar menunggu ✦ Duo Chaos Team
        </p>
      </main>
    </div>
  );
}

/* =========================================================
 * LOGO dengan cincin progres + orbit
 * ========================================================= */
function ProgressLogo({ progress, mounted }: { progress: number; mounted: boolean }) {
  const R = 58;
  const C = 2 * Math.PI * R;
  const offset = C - (C * progress) / 100;

  return (
    <div className="relative flex h-[148px] w-[148px] items-center justify-center sm:h-[168px] sm:w-[168px]">
      {/* orbit */}
      <div aria-hidden className="dc-orbit absolute inset-0">
        <span className="absolute -top-0.5 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-cyan-300 shadow-[0_0_14px_3px_rgba(103,232,249,.7)]" />
      </div>
      <div aria-hidden className="dc-orbit-rev absolute inset-3">
        <span className="absolute -bottom-0.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-fuchsia-300 shadow-[0_0_12px_3px_rgba(240,171,252,.7)]" />
      </div>

      <svg viewBox="0 0 140 140" className="absolute inset-0 h-full w-full -rotate-90">
        <defs>
          <linearGradient id="dc-ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="50%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#f472b6" />
          </linearGradient>
        </defs>
        <circle cx="70" cy="70" r={R} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="3" />
        <circle
          cx="70"
          cy="70"
          r={R}
          fill="none"
          stroke="url(#dc-ring)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={mounted ? offset : C}
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.22,1,.36,1)" }}
        />
      </svg>

      <div className="dc-float relative flex h-[84px] w-[84px] items-center justify-center rounded-[28px] border border-white/15 bg-gradient-to-br from-violet-500/30 to-cyan-400/10 shadow-[0_0_50px_-5px_rgba(139,92,246,.7)] backdrop-blur-md sm:h-[96px] sm:w-[96px]">
        <Gamepad2 className="h-10 w-10 text-white sm:h-11 sm:w-11" strokeWidth={1.6} />
      </div>

      <span className="absolute -bottom-3 rounded-full border border-white/10 bg-[#0d0827] px-2.5 py-0.5 font-mono text-[11px] font-semibold text-cyan-200 tabular-nums">
        {mounted ? Math.floor(progress) : 0}%
      </span>
    </div>
  );
}

/* =========================================================
 * KARTU dengan spotlight yang mengikuti sentuhan/kursor
 * ========================================================= */
function SpotCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      className={`dc-spot relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] p-5 text-left backdrop-blur-md ${className}`}
    >
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/* =========================================================
 * LATAR: jaringan partikel yang bereaksi ke pointer
 * ========================================================= */
function NetworkCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    let raf = 0;
    let link = 120;
    const pointer = { x: -9999, y: -9999 };
    type Node = { x: number; y: number; vx: number; vy: number; r: number };
    let nodes: Node[] = [];

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      link = w < 640 ? 95 : 130;
      const count = Math.round(Math.min(85, Math.max(28, (w * h) / 17000)));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.4 + 0.6,
      }));
    };

    const frame = () => {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        if (!reduce) {
          n.x += n.vx;
          n.y += n.vy;
          if (n.x < -10) n.x = w + 10;
          if (n.x > w + 10) n.x = -10;
          if (n.y < -10) n.y = h + 10;
          if (n.y > h + 10) n.y = -10;

          // tarikan halus ke pointer
          const dx = pointer.x - n.x;
          const dy = pointer.y - n.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 160 * 160) {
            n.x += dx * 0.006;
            n.y += dy * 0.006;
          }
        }

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(196,181,253,.7)";
        ctx.fill();

        for (let j = i + 1; j < nodes.length; j++) {
          const m = nodes[j];
          const dx = n.x - m.x;
          const dy = n.y - m.y;
          const d = Math.hypot(dx, dy);
          if (d < link) {
            ctx.strokeStyle = `rgba(139,92,246,${(1 - d / link) * 0.28})`;
            ctx.lineWidth = 0.7;
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(m.x, m.y);
            ctx.stroke();
          }
        }

        const pd = Math.hypot(n.x - pointer.x, n.y - pointer.y);
        if (pd < 170) {
          ctx.strokeStyle = `rgba(34,211,238,${(1 - pd / 170) * 0.55})`;
          ctx.lineWidth = 0.9;
          ctx.beginPath();
          ctx.moveTo(n.x, n.y);
          ctx.lineTo(pointer.x, pointer.y);
          ctx.stroke();
        }
      }
      if (!reduce) raf = requestAnimationFrame(frame);
    };

    const onMove = (e: PointerEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
    };
    const onLeave = () => {
      pointer.x = -9999;
      pointer.y = -9999;
    };
    let touchTimer: ReturnType<typeof setTimeout> | undefined;
    const onUp = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") {
        touchTimer = setTimeout(onLeave, 600);
      }
    };

    resize();
    frame();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onMove, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("pointerleave", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      if (touchTimer) clearTimeout(touchTimer);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}

/* =========================================================
 * MINI GAME: Tangkap Chaos (V2 - UPGRADED)
 * - Combo sistem: klik cepat = multiplier
 * - Particle effect saat klik
 * - Orb teleport jika lama tidak diklik
 * ========================================================= */
function ChaosCatcher() {
  const DURATION = 20; // Tambah durasi dikit biar lebih asik
  const [phase, setPhase] = useState<"idle" | "playing" | "done">("idle");
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [left, setLeft] = useState(DURATION);
  const [pos, setPos] = useState({ x: 50, y: 55 });
  const [combo, setCombo] = useState(1);
  const [particles, setParticles] = useState<{id: number, x: number, y: number}[]>([]);
  
  const scoreRef = useRef(0);
  const lastHitRef = useRef(0);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setBest(Number(safeGet(STORAGE.best)) || 0);
  }, []);

  const move = useCallback(() => {
    setPos({ x: 15 + Math.random() * 70, y: 25 + Math.random() * 55 });
  }, []);

  const start = () => {
    scoreRef.current = 0;
    lastHitRef.current = Date.now();
    setScore(0);
    setCombo(1);
    setLeft(DURATION);
    move();
    setPhase("playing");
  };

  // Teleport otomatis kalau user kelamaan (Chaos mode)
  useEffect(() => {
    if (phase !== "playing") return;
    
    // Semakin tinggi skor, semakin cepat dia teleport otomatis (kabur)
    const escapeTime = Math.max(700, 2000 - (score * 50)); 
    
    idleTimerRef.current = setInterval(() => {
      move();
      setCombo(1); // Reset combo kalau kelamaan
    }, escapeTime);

    return () => {
      if (idleTimerRef.current) clearInterval(idleTimerRef.current);
    };
  }, [phase, score, move]);

  // Main Timer
  useEffect(() => {
    if (phase !== "playing") return;
    const id = setInterval(() => {
      setLeft((l) => {
        if (l <= 1) {
          clearInterval(id);
          setPhase("done");
          if (scoreRef.current > (Number(safeGet(STORAGE.best)) || 0)) {
            safeSet(STORAGE.best, String(scoreRef.current));
            setBest(scoreRef.current);
          }
          return 0;
        }
        return l - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  // Hapus partikel efek setelah beberapa detik
  useEffect(() => {
    if (particles.length > 0) {
      const timer = setTimeout(() => {
        setParticles((prev) => prev.filter(p => Date.now() - p.id < 500));
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [particles]);

  const hit = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const now = Date.now();
    let currentCombo = combo;
    
    // Logika Combo: Kalau jarak klik < 800ms, combo naik
    if (now - lastHitRef.current < 800) {
      currentCombo = Math.min(currentCombo + 1, 5); // Maksimal 5x combo
    } else {
      currentCombo = 1;
    }
    
    setCombo(currentCombo);
    lastHitRef.current = now;
    
    // Tambah skor dikali combo
    scoreRef.current += (1 * currentCombo);
    setScore(scoreRef.current);
    
    // Efek ledakan partikel di posisi klik
    setParticles(prev => [...prev, { id: Date.now(), x: pos.x, y: pos.y }]);

    move();
    
    // Reset timer kabur
    if (idleTimerRef.current) {
      clearInterval(idleTimerRef.current);
      const escapeTime = Math.max(700, 2000 - (score * 50)); 
      idleTimerRef.current = setInterval(() => {
        move();
        setCombo(1);
      }, escapeTime);
    }
  };

  // Ukuran Orb mengecil, tapi ada batas wajar agar masih bisa diklik di HP
  const size = Math.max(38, 70 - score * 0.8);
  const getComboColor = () => {
    if(combo >= 5) return "text-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]";
    if(combo >= 3) return "text-amber-400";
    return "text-cyan-300";
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md relative overflow-hidden">
      <div className="mb-3 flex items-center justify-between text-[11px] font-medium tracking-[0.2em] text-white/40 uppercase">
        <span className="flex items-center gap-1.5">
          <Target className="h-3.5 w-3.5 text-cyan-300" /> Tangkap Chaos
        </span>
        <span>
          Rekor <span className="text-amber-300">{best}</span>
        </span>
      </div>

      <div
        className="relative h-60 sm:h-72 touch-manipulation overflow-hidden rounded-2xl border border-white/10 bg-black/40 select-none shadow-inner"
        style={{ touchAction: "manipulation" }}
      >
        {phase === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-5 text-center bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
            <Flame className="w-10 h-10 text-rose-500 opacity-80 mb-2 animate-bounce" />
            <p className="max-w-[16rem] text-xs leading-relaxed text-white/70">
              Ketuk orb secepat kilat dalam {DURATION} detik! Orb akan kabur jika kamu terlalu lama. Hasilkan <strong>COMBO</strong> untuk poin lipat ganda!
            </p>
            <button
              onClick={start}
              className="mt-2 h-11 rounded-xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-rose-500 px-8 text-sm font-bold text-white transition hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(244,63,94,0.4)]"
            >
              Mulai Gila
            </button>
          </div>
        )}

        {phase === "playing" && (
          <>
            {/* UI Top Bar */}
            <div className="pointer-events-none absolute inset-x-4 top-3 flex justify-between items-center z-20">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-white/60">Skor</span>
                <span className="text-xl font-black text-cyan-300 leading-none">{score}</span>
              </div>
              
              {/* Combo Indicator */}
              {combo > 1 && (
                <div className={`dc-pop text-lg font-black italic tracking-wider ${getComboColor()} transition-colors`}>
                  {combo}x COMBO!
                </div>
              )}

              <div className="flex flex-col text-right">
                <span className="text-[10px] font-semibold text-white/60">Sisa Waktu</span>
                <span className={`text-xl font-black tabular-nums leading-none ${left <= 5 ? "text-rose-500 animate-pulse" : "text-amber-300"}`}>
                  {left}s
                </span>
              </div>
            </div>

            {/* Progress Bar Waktu Bawah */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1.5 bg-white/5 z-20">
              <div
                className={`h-full transition-[width] duration-1000 ease-linear ${left <= 5 ? "bg-rose-500" : "bg-gradient-to-r from-violet-400 to-cyan-300"}`}
                style={{ width: `${(left / DURATION) * 100}%` }}
              />
            </div>

            {/* Render Efek Ledakan Partikel */}
            {particles.map(p => (
              <div 
                key={p.id}
                className="pointer-events-none absolute w-16 h-16 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-cyan-400/50 scale-150 opacity-0 transition-all duration-500 ease-out"
                style={{ 
                  left: `${p.x}%`, 
                  top: `${p.y}%`,
                  animation: 'dc-particle-burst 0.5s forwards'
                }}
              />
            ))}

            {/* Target Orb Utama */}
            <button
              onPointerDown={hit}
              aria-label="Tangkap orb"
              className="dc-pop absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_30%_30%,#a5f3fc,#8b5cf6)] shadow-[0_0_25px_5px_rgba(139,92,246,.8)] hover:scale-110 active:scale-75 transition-transform"
              style={{ left: `${pos.x}%`, top: `${pos.y}%`, width: size, height: size }}
            >
              {/* Inner core glow */}
              <div className="absolute inset-2 rounded-full bg-white/20 blur-sm animate-pulse" />
            </button>
          </>
        )}

        {phase === "done" && (
          <div className="dc-pop absolute inset-0 flex flex-col items-center justify-center gap-2 p-5 text-center bg-black/60 backdrop-blur-sm z-30">
            <Trophy className="h-10 w-10 text-amber-400 animate-bounce" />
            <div className="space-y-1">
              <p className="text-xs text-white/70 uppercase tracking-widest">Skor Akhir</p>
              <p className="text-4xl font-black text-cyan-300 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">
                {score}
              </p>
            </div>
            
            <p className="text-[11px] font-medium text-white/50 mt-1">
              {score > 0 && score >= best ? "🏆 GILAAA! REKOR BARU! 🔥" : "Yah... kurang cepet. Coba lagi!"}
            </p>
            
            <button
              onClick={start}
              className="mt-3 h-11 w-full max-w-[140px] rounded-xl border border-violet-400/40 bg-violet-500/20 px-5 text-xs font-bold text-white transition hover:bg-violet-500/40 active:scale-95 shadow-[0_0_15px_rgba(139,92,246,0.2)]"
            >
              Main Lagi
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
 * CSS (animasi & util)
 * ========================================================= */
const CSS = `
.dc-root { -webkit-tap-highlight-color: transparent; overscroll-behavior: contain; }

@keyframes dc-rise { from { opacity: 0; transform: translateY(18px) } to { opacity: 1; transform: none } }
@keyframes dc-pop { from { opacity: 0; transform: translate(-50%,-50%) scale(.3) } to { opacity: 1; transform: translate(-50%,-50%) scale(1) } }
@keyframes dc-pop-flat { from { opacity: 0; transform: scale(.94) } to { opacity: 1; transform: none } }
@keyframes dc-tick { from { opacity: .35; transform: translateY(-8px) } to { opacity: 1; transform: none } }
@keyframes dc-spin { to { transform: rotate(360deg) } }
@keyframes dc-spin-rev { to { transform: rotate(-360deg) } }
@keyframes dc-float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-6px) } }
@keyframes dc-shimmer { to { background-position: 200% center } }
@keyframes dc-drift1 { 0%,100% { transform: translate(0,0) scale(1) } 50% { transform: translate(8%,6%) scale(1.15) } }
@keyframes dc-drift2 { 0%,100% { transform: translate(0,0) scale(1) } 50% { transform: translate(-10%,-4%) scale(1.1) } }
@keyframes dc-particle-burst { 0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; border-width: 8px; } 100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; border-width: 0px; } }

.dc-rise { opacity: 0; animation: dc-rise .8s cubic-bezier(.22,1,.36,1) forwards; }
.dc-tick { animation: dc-tick .35s ease-out; }
.dc-orbit { animation: dc-spin 9s linear infinite; }
.dc-orbit-rev { animation: dc-spin-rev 14s linear infinite; }
.dc-float { animation: dc-float 4s ease-in-out infinite; }
.dc-pop { animation: dc-pop-flat .3s ease-out; }
button.dc-pop { animation: dc-pop .22s ease-out; }

.dc-gradient-text {
  background: linear-gradient(90deg, #a78bfa, #22d3ee, #f472b6, #a78bfa);
  background-size: 200% auto;
  -webkit-background-clip: text; background-clip: text;
  color: transparent;
  animation: dc-shimmer 5s linear infinite;
}

.dc-aurora { position: absolute; border-radius: 9999px; filter: blur(90px); opacity: .5; will-change: transform; }
.dc-a1 { width: 70vmax; height: 70vmax; left: -25vmax; top: -20vmax; background: radial-gradient(circle, rgba(139,92,246,.55), transparent 65%); animation: dc-drift1 18s ease-in-out infinite; }
.dc-a2 { width: 60vmax; height: 60vmax; right: -25vmax; top: 25%; background: radial-gradient(circle, rgba(34,211,238,.35), transparent 65%); animation: dc-drift2 22s ease-in-out infinite; }
.dc-a3 { width: 55vmax; height: 55vmax; left: 5%; bottom: -30vmax; background: radial-gradient(circle, rgba(244,114,182,.3), transparent 65%); animation: dc-drift1 26s ease-in-out infinite reverse; }

.dc-spot::before {
  content: ""; position: absolute; inset: 0; opacity: 0; transition: opacity .3s;
  background: radial-gradient(240px circle at var(--mx, 50%) var(--my, 50%), rgba(139,92,246,.28), transparent 70%);
}
.dc-spot:hover::before, .dc-spot:active::before { opacity: 1; }

.dc-cell::after {
  content: ""; position: absolute; inset: 0; pointer-events: none;
  background: linear-gradient(180deg, rgba(255,255,255,.07), transparent 45%);
}

.dc-scroll { scrollbar-width: none; -webkit-overflow-scrolling: touch; }
.dc-scroll::-webkit-scrollbar { display: none; }

@media (prefers-reduced-motion: reduce) {
  .dc-rise, .dc-tick, .dc-orbit, .dc-orbit-rev, .dc-float, .dc-gradient-text, .dc-aurora { animation: none !important; opacity: 1; }
}
`;