"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Gamepad2, Users, Sparkles, ArrowRight, Swords, BrainCircuit, Zap, ChevronLeft, Loader2 } from "lucide-react";
import { createRoom, joinRoom } from "@/modules/room/actions";

export default function LandingPage() {
  const router = useRouter();
  const [view, setView] = useState<"menu" | "create" | "join">("menu");
  
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [capacity, setCapacity] = useState<number>(2);
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      const code = await createRoom(playerName, capacity);
      router.push(`/room/${code}`);
    } catch (err: any) {
      setErrorMessage(err.message || "Terjadi kesalahan saat membuat room.");
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
      setErrorMessage(err.message || "Terjadi kesalahan saat bergabung ke room.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[90vh] space-y-12 pb-12">
      
      {/* HEADER SECTION */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4 mt-8"
      >
        <div className="inline-flex items-center justify-center p-3 bg-primary/20 rounded-2xl border border-primary/30 mb-4 shadow-[0_0_30px_rgba(139,92,246,0.3)]">
          <Gamepad2 className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
          DUO <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-secondary">CHAOS</span>
        </h1>
        <p className="text-lg md:text-xl text-textMuted font-medium tracking-wide">
          Two Players. Unlimited Chaos.
        </p>
      </motion.div>

      {/* MAIN ACTION CARD */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-panel w-full max-w-md p-6 md:p-8 overflow-hidden relative"
      >
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm text-center">
            {errorMessage}
          </div>
        )}

        <AnimatePresence mode="wait">
          
          {/* VIEW: MENU UTAMA */}
          {view === "menu" && (
            <motion.div
              key="menu"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <button 
                onClick={() => { setErrorMessage(""); setView("create"); }}
                className="w-full btn-primary py-4 text-lg"
              >
                <Sparkles className="w-5 h-5" />
                Create Room
              </button>
              <button 
                onClick={() => { setErrorMessage(""); setView("join"); }}
                className="w-full btn-secondary py-4 text-lg"
              >
                <Users className="w-5 h-5" />
                Join Room
              </button>
            </motion.div>
          )}

          {/* VIEW: CREATE ROOM */}
          {view === "create" && (
            <motion.form
              key="create"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleCreateRoom}
              className="space-y-5"
            >
              <div className="flex items-center gap-3 mb-6">
                <button type="button" onClick={() => setView("menu")} disabled={isLoading} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-bold">Create New Room</h2>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm text-textMuted font-medium">Nickname</label>
                <input 
                  type="text" 
                  required
                  maxLength={15}
                  disabled={isLoading}
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your name..." 
                  className="input-neon"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-textMuted font-medium">Room Capacity</label>
                <div className="flex gap-3">
                  {[2, 3, 4].map((num) => (
                    <button
                      key={num}
                      type="button"
                      disabled={isLoading}
                      onClick={() => setCapacity(num)}
                      className={`flex-1 py-3 rounded-xl border transition-all ${
                        capacity === num 
                          ? "bg-primary/20 border-primary text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]" 
                          : "border-white/10 text-textMuted hover:bg-white/5"
                      }`}
                    >
                      {num} Players
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={isLoading} className="w-full btn-primary mt-4">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Start Hosting <ArrowRight className="w-4 h-4" /></>}
              </button>
            </motion.form>
          )}

          {/* VIEW: JOIN ROOM */}
          {view === "join" && (
            <motion.form
              key="join"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleJoinRoom}
              className="space-y-5"
            >
              <div className="flex items-center gap-3 mb-6">
                <button type="button" onClick={() => setView("menu")} disabled={isLoading} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-bold">Join Room</h2>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm text-textMuted font-medium">Room Code</label>
                <input 
                  type="text" 
                  required
                  maxLength={6}
                  disabled={isLoading}
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="e.g. X7B9DQ" 
                  className="input-neon text-center text-2xl tracking-widest font-bold uppercase"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-textMuted font-medium">Nickname</label>
                <input 
                  type="text" 
                  required
                  maxLength={15}
                  disabled={isLoading}
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your name..." 
                  className="input-neon"
                />
              </div>

              <button type="submit" disabled={isLoading} className="w-full btn-primary mt-4">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Join Match <ArrowRight className="w-4 h-4" /></>}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>

      {/* GAMES SHOWCASE */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="w-full max-w-4xl pt-12 border-t border-white/10"
      >
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold mb-2">Available Mini-Games</h3>
          <p className="text-textMuted">Select from our growing collection of chaotic games.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-6 flex flex-col items-center text-center group hover:-translate-y-2 transition-transform duration-300">
            <div className="p-3 bg-accent/20 text-accent rounded-xl mb-4 group-hover:shadow-[0_0_20px_rgba(236,72,153,0.4)] transition-all">
              <Swords className="w-8 h-8" />
            </div>
            <h4 className="font-bold text-lg mb-2">Truth or Dare</h4>
            <p className="text-sm text-textMuted">Reveal your secrets or face ridiculous challenges.</p>
          </div>
          
          <div className="glass-panel p-6 flex flex-col items-center text-center group hover:-translate-y-2 transition-transform duration-300">
            <div className="p-3 bg-secondary/20 text-secondary rounded-xl mb-4 group-hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all">
              <BrainCircuit className="w-8 h-8" />
            </div>
            <h4 className="font-bold text-lg mb-2">Mind Reader</h4>
            <p className="text-sm text-textMuted">Think alike. Match answers secretly with your friends.</p>
          </div>
          
          <div className="glass-panel p-6 flex flex-col items-center text-center group hover:-translate-y-2 transition-transform duration-300">
            <div className="p-3 bg-yellow-500/20 text-yellow-400 rounded-xl mb-4 group-hover:shadow-[0_0_20px_rgba(234,179,8,0.4)] transition-all">
              <Zap className="w-8 h-8" />
            </div>
            <h4 className="font-bold text-lg mb-2">Speed Battle</h4>
            <p className="text-sm text-textMuted">Fast-paced trivia. The quickest answer wins the points.</p>
          </div>
        </div>
      </motion.div>

      <div className="text-center text-sm text-textMuted mt-12">
        <p>Built with Next.js, Supabase & Tailwind</p>
      </div>
    </div>
  );
}