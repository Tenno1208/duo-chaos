"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Gamepad2, Users, Sparkles, ArrowRight, Swords, BrainCircuit, 
  Zap, ChevronLeft, LogIn, UserPlus, ShieldCheck, Loader2, 
  Vote, UserX, Palette, Play
} from "lucide-react";
import { createRoom, joinRoom } from "@/modules/room/actions";
import { sounds } from "@/lib/audio";

const GAMES_LIST = [
  {
    id: "truth-or-dare",
    title: "Truth or Dare",
    desc: "Ungkap rahasia atau tuntaskan tantangan konyol.",
    icon: Swords,
    colorClass: "bg-accent/20 text-accent",
  },
  {
    id: "mind-reader",
    title: "Mind Reader",
    desc: "Cari tahu seberapa sefrekuensi kamu dengan temanmu.",
    icon: BrainCircuit,
    colorClass: "bg-secondary/20 text-secondary",
  },
  {
    id: "speed-battle",
    title: "Speed Battle",
    desc: "Adu cepat dan akurasi menjawab kuis trivia.",
    icon: Zap,
    colorClass: "bg-yellow-500/20 text-yellow-400",
  },
  {
    id: "most-likely-to",
    title: "Most Likely To",
    desc: "Voting siapa yang paling mungkin melakukan hal konyol.",
    icon: Vote,
    colorClass: "bg-pink-500/20 text-pink-400",
  },
  {
    id: "impostor-word",
    title: "Detektif Impostor",
    desc: "Temukan penyusup yang tidak tahu kata kunci rahasia.",
    icon: UserX,
    colorClass: "bg-red-500/20 text-red-400",
  },
  {
    id: "doodle-guess",
    title: "Tebak Gambar",
    desc: "Coret-coret kanvas realtime dan adu cepat menebaknya.",
    icon: Palette,
    colorClass: "bg-purple-500/20 text-purple-400",
  },
];

export default function LandingPage() {
  const router = useRouter();
  const supabase = createClient();

  // State User Sesi
  const [sessionUser, setSessionUser] = useState<{ id: string; username: string; is_guest: boolean } | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // State Navigasi View: Tambahkan "splash" sebagai tampilan awal
  const [view, setView] = useState<"splash" | "intro" | "create" | "join">("splash");
  
  // State Form Input
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [capacity, setCapacity] = useState<number>(2);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data } = await supabase
          .from("profiles")
          .select("username, is_guest")
          .eq("id", session.user.id)
          .single();

        if (data) {
          setSessionUser({
            id: session.user.id,
            username: data.username,
            is_guest: data.is_guest,
          });
          setPlayerName(data.username);
        }
      }
      setCheckingAuth(false);
    }

    checkAuth();
  }, []);

  const handleEnterChaos = () => {
    sounds.playClick();
    setView("intro");
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      const code = await createRoom(playerName, capacity);
      router.push(`/room/${code}`);
    } catch (err: any) {
      setErrorMessage(err.message || "Gagal membuat room.");
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      const code = await joinRoom(roomCode, playerName);
      router.push(`/room/${code}`);
    } catch (err: any) {
      setErrorMessage(err.message || "Gagal bergabung ke room.");
      setIsLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] pb-12 overflow-hidden">
      
      <AnimatePresence mode="wait">
        
        {/* ========================================== */}
        {/* 1. HALAMAN INTRO ANIMASI (SPLASH SCREEN)    */}
        {/* ========================================== */}
        {view === "splash" && (
          <motion.div
            key="splash"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center min-h-[75vh] text-center space-y-8 px-4"
          >
            {/* LOGO IKON ANIMASI PULSATING */}
            <motion.div 
              animate={{ 
                scale: [1, 1.08, 1],
                rotate: [0, -3, 3, 0]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 3, 
                ease: "easeInOut" 
              }}
              className="p-5 bg-gradient-to-br from-primary/30 to-accent/20 rounded-3xl border border-primary/40 shadow-[0_0_50px_rgba(139,92,246,0.5)]"
            >
              <Gamepad2 className="w-16 h-16 md:w-20 md:h-20 text-primary drop-shadow-[0_0_15px_rgba(139,92,246,0.8)]" />
            </motion.div>

            {/* JUDUL GLITCH / NEON */}
            <div className="space-y-3">
              <motion.h1 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-6xl md:text-8xl font-black tracking-tight"
              >
                DUO <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-secondary animate-pulse">CHAOS</span>
              </motion.h1>

              <motion.p 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-sm md:text-base text-textMuted font-medium tracking-widest uppercase max-w-sm mx-auto"
              >
                Multiplayer Realtime Mini-Game Platform
              </motion.p>
            </div>

            {/* TOMBOL MASUK GAME */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <button
                onClick={handleEnterChaos}
                className="btn-primary py-4 px-10 text-lg md:text-xl font-black tracking-wider flex items-center gap-3 shadow-[0_0_30px_rgba(139,92,246,0.6)] hover:scale-105 active:scale-95 transition-all"
              >
                <Play className="w-6 h-6 fill-current" /> MASUK ARENA
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* ========================================== */}
        {/* 2. HALAMAN UTAMA (MENU & SHOWCASE GAME)    */}
        {/* ========================================== */}
        {view !== "splash" && (
          <motion.div 
            key="main"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full flex flex-col items-center space-y-10"
          >
            {/* HERO TITLE SECTION */}
            <div className="text-center space-y-3 mt-4">
              <div className="inline-flex items-center justify-center p-3 bg-primary/20 rounded-2xl border border-primary/30 mb-2 shadow-[0_0_30px_rgba(139,92,246,0.3)]">
                <Gamepad2 className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
                DUO <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-secondary">CHAOS</span>
              </h1>
              <p className="text-base md:text-lg text-textMuted font-medium tracking-wide max-w-md mx-auto">
                Two Players. Unlimited Chaos. Bermain mini-game seru bersama temanmu secara real-time!
              </p>
            </div>

            {/* MAIN CARD SECTION */}
            <div className="glass-panel w-full max-w-md p-6 md:p-8 overflow-hidden relative">
              {errorMessage && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-xs text-center">
                  {errorMessage}
                </div>
              )}

              <AnimatePresence mode="wait">
                
                {/* VIEW 1: INTRO MENU */}
                {view === "intro" && (
                  <motion.div
                    key="intro"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-5 text-center"
                  >
                    {sessionUser ? (
                      <div className="p-4 bg-primary/10 border border-primary/30 rounded-2xl flex items-center justify-between text-left mb-2">
                        <div>
                          <span className="text-[10px] text-textMuted uppercase font-bold tracking-wider">Selamat Datang</span>
                          <h2 className="text-lg font-bold text-white flex items-center gap-1.5">
                            {sessionUser.username}
                            {sessionUser.is_guest ? (
                              <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded font-mono">Guest</span>
                            ) : (
                              <ShieldCheck className="w-4 h-4 text-secondary" />
                            )}
                          </h2>
                        </div>
                        <button 
                          onClick={() => router.push("/profile")} 
                          className="text-xs bg-white/10 hover:bg-white/20 border border-white/10 px-3 py-2 rounded-xl text-white font-semibold transition-all"
                        >
                          Profil
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3 pb-2 border-b border-white/10">
                        <p className="text-sm font-semibold text-textMain">
                          Pilih cara bermain kamu:
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <button 
                            onClick={() => router.push("/login")}
                            className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 transition-all"
                          >
                            <LogIn className="w-4 h-4 text-secondary" /> Login Akun
                          </button>
                          <button 
                            onClick={() => router.push("/login")}
                            className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 transition-all"
                          >
                            <UserPlus className="w-4 h-4 text-accent" /> Daftar Baru
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-3 pt-1">
                      <button 
                        onClick={() => { sounds.playClick(); setErrorMessage(""); setView("create"); }}
                        className="w-full btn-primary py-4 text-base"
                      >
                        <Sparkles className="w-5 h-5" /> Buat Room Baru
                      </button>
                      
                      <button 
                        onClick={() => { sounds.playClick(); setErrorMessage(""); setView("join"); }}
                        className="w-full btn-secondary py-4 text-base"
                      >
                        <Users className="w-5 h-5" /> Gabung Room (Kode)
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* VIEW 2: FORM CREATE ROOM */}
                {view === "create" && (
                  <motion.form
                    key="create"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    onSubmit={handleCreateRoom}
                    className="space-y-5"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <button type="button" onClick={() => { sounds.playClick(); setView("intro"); }} disabled={isLoading} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <h2 className="text-xl font-bold">Buat Room Baru</h2>
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-xs text-textMuted font-medium">Nickname Kamu</label>
                      <input 
                        type="text" 
                        required
                        maxLength={15}
                        disabled={isLoading}
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        placeholder="Masukkan nama..." 
                        className="input-neon text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs text-textMuted font-medium">Kapasitas Pemain</label>
                      <div className="flex gap-3">
                        {[2, 3, 4].map((num) => (
                          <button
                            key={num}
                            type="button"
                            disabled={isLoading}
                            onClick={() => { sounds.playClick(); setCapacity(num); }}
                            className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all ${
                              capacity === num 
                                ? "bg-primary/20 border-primary text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]" 
                                : "border-white/10 text-textMuted hover:bg-white/5"
                            }`}
                          >
                            {num} Player
                          </button>
                        ))}
                      </div>
                    </div>

                    <button type="submit" disabled={isLoading} className="w-full btn-primary mt-2">
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Mulai Hosting <ArrowRight className="w-4 h-4" /></>}
                    </button>
                  </motion.form>
                )}

                {/* VIEW 3: FORM JOIN ROOM */}
                {view === "join" && (
                  <motion.form
                    key="join"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    onSubmit={handleJoinRoom}
                    className="space-y-5"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <button type="button" onClick={() => { sounds.playClick(); setView("intro"); }} disabled={isLoading} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <h2 className="text-xl font-bold">Gabung Room</h2>
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-xs text-textMuted font-medium">Kode Room (6 Karakter)</label>
                      <input 
                        type="text" 
                        required
                        maxLength={6}
                        disabled={isLoading}
                        value={roomCode}
                        onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                        placeholder="Contoh: X7B9DQ" 
                        className="input-neon text-center text-2xl tracking-widest font-bold uppercase"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs text-textMuted font-medium">Nickname Kamu</label>
                      <input 
                        type="text" 
                        required
                        maxLength={15}
                        disabled={isLoading}
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        placeholder="Masukkan nama..." 
                        className="input-neon text-sm"
                      />
                    </div>

                    <button type="submit" disabled={isLoading} className="w-full btn-primary mt-2">
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Masuk Room <ArrowRight className="w-4 h-4" /></>}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>

            {/* SHOWCASE GAME (RENDER DINAMIS SEMUA MINI-GAME) */}
            <div className="w-full max-w-4xl pt-8 border-t border-white/10">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold mb-1">Daftar Mini-Game</h3>
                <p className="text-xs text-textMuted">Pilihan game seru yang siap dimainkan dalam satu room.</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {GAMES_LIST.map((game) => {
                  const Icon = game.icon;
                  return (
                    <div key={game.id} className="glass-panel p-5 flex flex-col items-center text-center hover:border-white/20 transition-all">
                      <div className={`p-3 rounded-xl mb-3 ${game.colorClass}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-base mb-1">{game.title}</h4>
                      <p className="text-xs text-textMuted">{game.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}