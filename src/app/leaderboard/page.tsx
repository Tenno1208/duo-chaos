"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { Trophy, Crown, Medal, ArrowLeft, Loader2, Zap, Award } from "lucide-react";

interface LeaderboardUser {
  id: string;
  username: string;
  xp: number;
  wins: number;
  total_matches: number;
  is_guest: boolean;
}

export default function LeaderboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      const { data } = await supabase
        .from("profiles")
        .select("id, username, xp, wins, total_matches, is_guest")
        .order("xp", { ascending: false })
        .limit(20);

      if (data) {
        setLeaderboard(data as LeaderboardUser[]);
      }
      setLoading(false);
    }

    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-textMuted">Memuat Klasemen Global...</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6 py-6">
      <button 
        onClick={() => router.push("/")} 
        className="flex items-center gap-2 text-textMuted hover:text-white transition-colors text-sm font-semibold"
      >
        <ArrowLeft className="w-4 h-4" /> Kembali ke Home
      </button>

      <div className="text-center space-y-2">
        <div className="inline-flex p-3 bg-yellow-500/20 text-yellow-400 rounded-2xl border border-yellow-500/30 mb-1 shadow-[0_0_25px_rgba(234,179,8,0.3)]">
          <Trophy className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-black">Global Leaderboard</h1>
        <p className="text-xs text-textMuted">Top 20 pemain terbaik dengan akumulasi XP tertinggi di DUO CHAOS.</p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-4 space-y-3"
      >
        {leaderboard.map((user, idx) => {
          const rank = idx + 1;
          const level = Math.floor((user.xp || 0) / 100) + 1;

          return (
            <div
              key={user.id}
              className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                rank === 1
                  ? "bg-gradient-to-r from-yellow-500/20 to-primary/20 border-yellow-500/60 shadow-[0_0_15px_rgba(234,179,8,0.2)]"
                  : rank === 2
                  ? "bg-gradient-to-r from-slate-400/20 to-primary/10 border-slate-400/50"
                  : rank === 3
                  ? "bg-gradient-to-r from-amber-700/20 to-primary/10 border-amber-700/50"
                  : "bg-white/5 border-white/10"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 flex justify-center font-bold text-lg">
                  {rank === 1 ? (
                    <Crown className="w-6 h-6 text-yellow-400 drop-shadow-[0_0_10px_rgba(234,179,8,0.8)]" />
                  ) : rank === 2 ? (
                    <Medal className="w-6 h-6 text-slate-300" />
                  ) : rank === 3 ? (
                    <Medal className="w-6 h-6 text-amber-600" />
                  ) : (
                    <span className="text-textMuted text-sm">#{rank}</span>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{user.username}</span>
                    {user.is_guest && (
                      <span className="text-[9px] bg-white/10 text-textMuted px-1.5 py-0.2 rounded">Guest</span>
                    )}
                  </div>
                  <div className="text-[10px] text-textMuted flex items-center gap-2 mt-0.5">
                    <span className="text-secondary font-semibold">Lvl {level}</span>
                    <span>•</span>
                    <span>{user.wins || 0} Win ({user.total_matches || 0} Match)</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="font-extrabold text-secondary text-base flex items-center gap-1 justify-end">
                  <Zap className="w-4 h-4 fill-current" /> {user.xp || 0}
                </span>
                <span className="text-[9px] text-textMuted uppercase font-bold">Total XP</span>
              </div>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}