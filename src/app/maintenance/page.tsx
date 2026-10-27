"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Wrench,
  Clock,
  Sparkles,
  Gamepad2,
  Zap,
  Swords,
  Trophy,
  ServerCog,
  Bell,
  CheckCircle2,
  Loader2,
  Circle,
  Target,
} from "lucide-react";

/**
 * ============ KONFIGURASI ============
 * Atur waktu selesai maintenance lewat .env:
 * NEXT_PUBLIC_MAINTENANCE_END="2026-10-31T12:00:00+07:00"
 * Kalau tidak diisi, otomatis 3 hari dari kunjungan pertama
 * (disimpan di localStorage, jadi TIDAK reset saat di-refresh).
 */
const DEFAULT_DURATION_MS = 3 * 24 * 60 * 60 * 1000;
const END_ENV = process.env.NEXT_PUBLIC_MAINTENANCE_END;

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

const UPDATES = [
  { label: "Migrasi server ke infrastruktur baru", done: true },
  { label: "Optimasi matchmaking & latency", done: true },
  { label: "Pembersihan bug & balancing arena", done: false, active: true },
  { label: "Peluncuran fitur baru", done: false },
];

const FEATURES = [
  {
    icon: Swords,
    title: "Mode Arena Baru",
    desc: "Duel chaos dengan aturan acak tiap ronde.",
  },
  {
    icon: Trophy,
    title: "Leaderboard Musiman",
    desc: "Naik peringkat, rebut hadiah eksklusif.",
  },
  {
    icon: Zap,
    title: "Power-Up Chaos",
    desc: "Kemampuan spesial yang bikin match makin gokil.",
  },
  {
    icon: ServerCog,
    title: "Server Lebih Ngebut",
    desc: "Lag berkurang drastis, mabar makin mulus.",
  },
];

export default function MaintenancePage() {
  const [mounted, setMounted] = useState(false);
  const [window_, setWindow_] = useState<{ start: number; end: number }>({
    start: 0,
    end: 0,
  });
  const [now, setNow] = useState(0);

  // --- notifikasi email ---
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [emailError, setEmailError] = useState("");

  // --- init waktu (persisten) ---
  useEffect(() => {
    const current = Date.now();
    let start = Number(safeGet(STORAGE.start));
    let end = Number(safeGet(STORAGE.end));

    if (END_ENV) {
      const parsed = new Date(END_ENV).getTime();
      if (!Number.isNaN(parsed)) end = parsed;
    }
    if (!start) {
      start = current;
      safeSet(STORAGE.start, String(start));
    }
    if (!end) {
      end = start + DEFAULT_DURATION_MS;
      safeSet(STORAGE.end, String(end));
    }

    setWindow_({ start, end });
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

  const diff = Math.max(window_.end - now, 0);
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
    const total = window_.end - window_.start;
    if (!mounted || total <= 0) return 0;
    return Math.min(Math.max(((now - window_.start) / total) * 100, 0), 100);
  }, [mounted, now, window_]);

  const submitEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Format email belum valid, coba cek lagi.");
      return;
    }
    setEmailError("");
    safeSet(STORAGE.email, email);
    setSubscribed(true);
  };

  // --- partikel latar (posisi stabil, dibuat setelah mount) ---
  const particles = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        left: (i * 47) % 100,
        size: 2 + ((i * 13) % 4),
        duration: 10 + ((i * 7) % 12),
        delay: -((i * 3) % 14),
        hue: i % 3,
      })),
    []
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0a061e] text-textMain selection:bg-primary selection:text-white">
      <style>{`
        @keyframes dc-float { 0%{transform:translateY(0) scale(1);opacity:0} 10%{opacity:.7} 90%{opacity:.7} 100%{transform:translateY(-105vh) scale(.6);opacity:0} }
        @keyframes dc-shimmer { 0%{background-position:0% 50%} 100%{background-position:200% 50%} }
        @keyframes dc-pop { 0%{transform:scale(0);opacity:0} 100%{transform:scale(1);opacity:1} }
        @keyframes dc-tick { 0%{transform:translateY(-4px);opacity:.4} 100%{transform:translateY(0);opacity:1} }
        @keyframes dc-grid { 0%{background-position:0 0} 100%{background-position:0 48px} }
        .dc-shimmer-text{background-size:200% auto;animation:dc-shimmer 4s linear infinite}
        .dc-pop{animation:dc-pop .25s ease-out}
        .dc-tick{animation:dc-tick .3s ease-out}
        @media (prefers-reduced-motion: reduce){ .dc-particle,.dc-shimmer-text,.dc-grid{animation:none!important} }
      `}</style>

      {/* GRID LATAR */}
      <div
        className="dc-grid pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(to right,#8b5cf6 1px,transparent 1px),linear-gradient(to bottom,#8b5cf6 1px,transparent 1px)",
          backgroundSize: "48px 48px",
          animation: "dc-grid 6s linear infinite",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, black 30%, transparent 80%)",
        }}
      />

      {/* GLOW ATMOSFER */}
      <div className="pointer-events-none absolute top-10 left-1/2 -translate-x-1/2 h-72 w-72 md:h-96 md:w-96 rounded-full bg-primary/15 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-10 left-1/4 h-64 w-64 rounded-full bg-secondary/10 blur-[100px]" />

      {/* PARTIKEL */}
      {mounted &&
        particles.map((p) => (
          <span
            key={p.id}
            className="dc-particle pointer-events-none absolute bottom-0 rounded-full"
            style={{
              left: `${p.left}%`,
              width: p.size,
              height: p.size,
              background: ["#8b5cf6", "#22d3ee", "#f472b6"][p.hue],
              boxShadow: `0 0 ${p.size * 2}px ${["#8b5cf6", "#22d3ee", "#f472b6"][p.hue]}`,
              animation: `dc-float ${p.duration}s linear ${p.delay}s infinite`,
            }}
          />
        ))}

      {/* CONTAINER UTAMA */}
      <div className="relative z-10 flex min-h-full items-center justify-center p-3 sm:p-6 md:py-12">
        <div className="glass-panel w-full max-w-xl space-y-5 sm:space-y-6 border border-primary/30 p-5 sm:p-8 text-center shadow-[0_0_50px_rgba(139,92,246,0.25)] backdrop-blur-xl">
          
          {/* HEADER SECTION */}
          <div className="space-y-3">
            <div className="mx-auto inline-flex items-center justify-center rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/30 to-accent/20 p-3.5 shadow-[0_0_25px_rgba(139,92,246,0.4)]">
              <Gamepad2 className="h-9 w-9 sm:h-10 sm:w-10 text-primary" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-yellow-500/30 bg-yellow-500/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-yellow-400">
                <Wrench className="h-3 w-3 animate-spin" />
                {finished ? "Hampir Selesai" : "Maintenance Rutin"}
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white leading-tight">
              DUO{" "}
              <span className="dc-shimmer-text bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                CHAOS
              </span>
              <span className="block text-lg sm:text-xl md:text-2xl font-extrabold text-textMuted mt-0.5">
                {finished ? "SEBENTAR LAGI BUKA!" : "KEMBALI LEBIH GILA!"}
              </span>
            </h1>

            <p className="mx-auto max-w-sm sm:max-w-md text-xs sm:text-sm leading-relaxed text-textMuted">
              Tim developer sedang merombak total performa server, menambah fitur gokil, dan membasmi bug demi pengalaman mabar yang maksimal.
            </p>
          </div>

          {/* COUNTDOWN BOXES */}
          <div className="space-y-2.5 bg-white/[0.02] border border-white/5 rounded-2xl p-3 sm:p-4">
            <span className="flex items-center justify-center gap-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-textMuted">
              <Clock className="h-3.5 w-3.5 text-secondary" /> Estimasi Arena Dibuka Kembali
            </span>

            <div className="grid grid-cols-4 gap-2">
              {[
                { v: time.days, l: "Hari", c: "text-white" },
                { v: time.hours, l: "Jam", c: "text-secondary" },
                { v: time.minutes, l: "Menit", c: "text-accent" },
                { v: time.seconds, l: "Detik", c: "text-yellow-400" },
              ].map((t) => (
                <div
                  key={t.l}
                  className="rounded-xl border border-white/10 bg-white/5 py-2.5 px-1 sm:p-3 text-center"
                >
                  <span
                    key={mounted ? t.v : "x"}
                    className={`dc-tick block font-mono text-xl sm:text-2xl md:text-3xl font-black tabular-nums ${t.c}`}
                  >
                    {mounted ? pad(t.v) : "--"}
                  </span>
                  <span className="block text-[9px] sm:text-[10px] font-bold uppercase text-textMuted mt-0.5">
                    {t.l}
                  </span>
                </div>
              ))}
            </div>

            {/* PROGRESS BAR */}
            <div className="space-y-1 pt-1">
              <div className="h-2 w-full overflow-hidden rounded-full border border-white/10 bg-white/5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary via-accent to-secondary shadow-[0_0_10px_rgba(139,92,246,0.6)] transition-all duration-1000"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-semibold uppercase tracking-wider text-textMuted px-0.5">
                <span>Progres sistem</span>
                <span className="text-secondary font-mono">
                  {mounted ? Math.floor(progress) : 0}%
                </span>
              </div>
            </div>
          </div>

          {/* STATUS CHECKLIST */}
          <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 sm:p-4 text-left">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-textMuted">
              Status Pengerjaan
            </p>
            <div className="space-y-2">
              {UPDATES.map((u) => (
                <div key={u.label} className="flex items-center gap-2.5 text-xs sm:text-sm">
                  {u.done ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-green-400" />
                  ) : u.active ? (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-yellow-400" />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0 text-white/20" />
                  )}
                  <span
                    className={
                      u.done
                        ? "text-textMuted line-through decoration-white/20 text-xs sm:text-sm"
                        : u.active
                        ? "font-semibold text-white text-xs sm:text-sm"
                        : "text-textMuted text-xs sm:text-sm"
                    }
                  >
                    {u.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* FITUR / TEROBOSAN BARU */}
          <div className="space-y-2.5">
            <span className="flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-textMuted">
              <Sparkles className="h-3.5 w-3.5 text-accent" /> Yang Bakal Hadir
            </span>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {FEATURES.map((f) => {
                const Icon = f.icon;
                return (
                  <div
                    key={f.title}
                    className="group rounded-xl border border-white/10 bg-white/[0.03] p-3 text-left transition hover:border-primary/40 hover:bg-primary/10"
                  >
                    <div className="mb-2 inline-flex rounded-lg border border-primary/30 bg-primary/20 p-2">
                      <Icon className="h-3.5 w-3.5 text-accent transition group-hover:scale-110" />
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-white">{f.title}</p>
                    <p className="text-[11px] sm:text-xs leading-relaxed text-textMuted mt-0.5">{f.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* MINI GAME */}
          <div className="pt-1">
            <ChaosCatcher />
          </div>

          {/* NOTIFIKASI EMAIL */}
          <div className="rounded-2xl border border-primary/20 bg-primary/10 p-3.5 sm:p-4">
            {subscribed ? (
              <div className="dc-pop flex items-center justify-center gap-2 text-xs font-medium text-secondary sm:text-sm py-1">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-green-400" />
                <span>Siap! Kami kabari ke <strong className="text-white">{email}</strong> begitu arena dibuka.</span>
              </div>
            ) : (
              <form onSubmit={submitEmail} className="space-y-2">
                <p className="flex items-center justify-center gap-1.5 text-xs font-bold text-white">
                  <Bell className="h-3.5 w-3.5 text-accent" /> Kabari aku pas udah buka
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="emailkamu@contoh.com"
                    aria-label="Email untuk notifikasi"
                    className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs sm:text-sm text-white outline-none placeholder:text-white/30 focus:border-primary/60"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-gradient-to-r from-primary to-accent px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-[0_0_15px_rgba(139,92,246,0.3)] transition hover:scale-[1.02] active:scale-95 shrink-0"
                  >
                    Notify Me
                  </button>
                </div>
                {emailError && (
                  <p className="text-left text-xs text-red-400">{emailError}</p>
                )}
              </form>
            )}
          </div>

          {/* FOOTER NOTE */}
          <p className="flex items-center justify-center gap-1.5 text-xs font-medium text-secondary pt-1">
            <Sparkles className="h-3.5 w-3.5 shrink-0 text-accent" /> Siapkan diri kalian untuk kekacauan baru!
          </p>

        </div>
      </div>
    </div>
  );
}

/* =========================================================
 * MINI GAME: Tangkap Chaos — klik orb sebanyak mungkin
 * dalam 15 detik. Skor terbaik disimpan di localStorage.
 * ========================================================= */
function ChaosCatcher() {
  const DURATION = 15;
  const [state, setState] = useState<"idle" | "playing" | "done">("idle");
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [left, setLeft] = useState(DURATION);
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const scoreRef = useRef(0);

  useEffect(() => {
    setBest(Number(safeGet(STORAGE.best)) || 0);
  }, []);

  const move = useCallback(() => {
    setPos({ x: 12 + Math.random() * 76, y: 15 + Math.random() * 70 });
  }, []);

  const start = () => {
    scoreRef.current = 0;
    setScore(0);
    setLeft(DURATION);
    move();
    setState("playing");
  };

  useEffect(() => {
    if (state !== "playing") return;
    const id = setInterval(() => {
      setLeft((l) => {
        if (l <= 1) {
          clearInterval(id);
          setState("done");
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
  }, [state]);

  const hit = () => {
    scoreRef.current += 1;
    setScore(scoreRef.current);
    move();
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-textMuted px-1">
        <span className="flex items-center gap-1">
          <Target className="h-3 w-3 text-secondary" /> Mini-Game: Tangkap Chaos
        </span>
        <span>
          Terbaik: <span className="text-yellow-400 font-mono font-bold">{best}</span>
        </span>
      </div>

      <div className="relative h-40 sm:h-44 select-none overflow-hidden rounded-2xl border border-white/10 bg-black/40">
        {state === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 p-4 text-center">
            <p className="text-xs text-textMuted max-w-xs">
              Sambil nunggu, klik orb sebanyak-banyaknya dalam {DURATION} detik!
            </p>
            <button
              onClick={start}
              className="rounded-xl bg-gradient-to-r from-primary to-accent px-4 py-2 text-xs sm:text-sm font-bold text-white transition hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(139,92,246,0.3)]"
            >
              Mulai Main
            </button>
          </div>
        )}

        {state === "playing" && (
          <>
            <div className="absolute left-3 top-2.5 text-xs font-bold text-white">
              Skor: <span className="text-accent font-mono">{score}</span>
            </div>
            <div className="absolute right-3 top-2.5 text-xs font-bold text-white">
              ⏱ <span className="text-yellow-400 font-mono">{left}s</span>
            </div>
            <button
              onClick={hit}
              aria-label="Tangkap orb"
              className="dc-pop absolute h-12 w-12 sm:h-14 sm:w-14 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-accent to-primary shadow-[0_0_20px_rgba(139,92,246,0.9)] transition-transform active:scale-75 flex items-center justify-center cursor-pointer"
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            >
              <div className="w-4 h-4 rounded-full bg-white/80 animate-ping absolute" />
            </button>
          </>
        )}

        {state === "done" && (
          <div className="dc-pop absolute inset-0 flex flex-col items-center justify-center gap-1.5 p-4 text-center">
            <Trophy className="h-6 w-6 sm:h-7 sm:w-7 text-yellow-400 animate-bounce" />
            <p className="text-xs sm:text-sm font-bold text-white">
              Skor kamu: <span className="text-accent font-mono">{score}</span>
            </p>
            <p className="text-[11px] sm:text-xs text-textMuted">
              {score >= best && score > 0
                ? "Rekor baru! 🔥"
                : "Coba lagi buat pecahin rekor!"}
            </p>
            <button
              onClick={start}
              className="mt-1 rounded-xl border border-primary/40 bg-primary/20 px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-primary/30"
            >
              Main Lagi
            </button>
          </div>
        )}
      </div>
    </div>
  );
}