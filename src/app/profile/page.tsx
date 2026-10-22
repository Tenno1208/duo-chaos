"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { User, Trophy, Gamepad2, Zap, ArrowLeft, Loader2, Award, ShieldCheck } from "lucide-react";

interface ProfileData {
  username: string;
  is_guest: boolean;
  xp: number;
  total_matches: number;
  wins: number;
  created_at: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("username, is_guest, xp, total_matches, wins, created_at")
        .eq("id", session.user.id)
        .single();

      if (data) {
        setProfile({
          username: data.username,
          is_guest: data.is_guest,
          xp: data.xp || 0,
          total_matches: data.total_matches || 0,
          wins: data.wins || 0,
          created_at: data.created_at,
        });
      }
      setLoading(false);
    }

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-textMuted">Memuat Profil Pemain...</p>
      </div>
    );
  }

  // Kalkulasi Level berdasarkan total XP (Tiap 100 XP = 1 Level)
  const xp = profile?.xp || 0;
  const level = Math.floor(xp / 100) + 1;
  const currentLevelXp = xp % 100;

  return (
    <div className="max-w-xl mx-auto space-y-6 py-6">
      {/* BUTTON BACK */}
      <button 
        onClick={() => router.push("/")} 
        className="flex items-center gap-2 text-textMuted hover:text-white transition-colors text-sm font-semibold"
      >
        <ArrowLeft className="w-4 h-4" /> Kembali ke Home
      </button>

      {/* CARD PROFIL UTAMA */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-6 md:p-8 space-y-6 text-center relative overflow-hidden"
      >
        {/* AVATAR & USERNAME */}
        <div className="flex flex-col items-center space-y-3">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-primary via-accent to-secondary p-1 shadow-[0_0_25px_rgba(139,92,246,0.4)]">
            <div className="w-full h-full bg-background rounded-[22px] flex items-center justify-center font-black text-3xl text-white">
              {profile?.username?.[0]?.toUpperCase() || "P"}
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-extrabold text-white flex items-center justify-center gap-2">
              {profile?.username}
              {profile?.is_guest && (
                <span className="text-xs bg-white/10 text-textMuted px-2.5 py-0.5 rounded-full border border-white/10 font-normal">
                  Guest Mode
                </span>
              )}
            </h1>
            <p className="text-xs text-textMuted mt-1">
              Bergabung sejak {new Date(profile?.created_at || Date.now()).toLocaleDateString("id-ID")}
            </p>
          </div>
        </div>

        {/* PROGRESS LEVEL BAR */}
        <div className="space-y-2 bg-black/40 border border-white/10 p-4 rounded-2xl">
          <div className="flex justify-between items-center text-sm font-bold">
            <span className="text-secondary flex items-center gap-1.5">
              <Zap className="w-4 h-4 fill-current" /> Level {level}
            </span>
            <span className="text-textMuted text-xs">{currentLevelXp} / 100 XP</span>
          </div>

          <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary via-accent to-secondary transition-all duration-500"
              style={{ width: `${currentLevelXp}%` }}
            />
          </div>
        </div>

        {/* STATISTIK PERTANDINGAN */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-center">
            <Gamepad2 className="w-5 h-5 text-primary mx-auto mb-1" />
            <div className="text-xl font-bold text-white">{profile?.total_matches}</div>
            <div className="text-[10px] text-textMuted uppercase tracking-wider font-semibold">Match</div>
          </div>

          <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-center">
            <Trophy className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
            <div className="text-xl font-bold text-white">{profile?.wins}</div>
            <div className="text-[10px] text-textMuted uppercase tracking-wider font-semibold">Menang</div>
          </div>

          <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-center">
            <Award className="w-5 h-5 text-secondary mx-auto mb-1" />
            <div className="text-xl font-bold text-white">{profile?.xp}</div>
            <div className="text-[10px] text-textMuted uppercase tracking-wider font-semibold">Total XP</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}