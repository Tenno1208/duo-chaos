"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { ShieldCheck, Trophy, Zap, Award, ShoppingBag, ArrowLeft, Loader2, Check, Sparkles } from "lucide-react";
import { sounds } from "@/lib/audio";

interface ProfileData {
  id: string;
  username: string;
  xp: number;
  wins: number;
  total_matches: number;
  is_guest: boolean;
  title?: string;
  frame_color?: string;
}

const FRAME_ITEMS = [
  { id: "border-white/10", name: "Default Basic", colorClass: "border-white/10", cost: 0 },
  { id: "border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.5)]", name: "Cyan Neon", colorClass: "border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.5)]", cost: 100 },
  { id: "border-purple-500 shadow-[0_0_15px_rgba(139,92,246,0.5)]", name: "Purple Chaos", colorClass: "border-purple-500 shadow-[0_0_15px_rgba(139,92,246,0.5)]", cost: 250 },
  { id: "border-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.8)]", name: "Golden Legend", colorClass: "border-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.8)]", cost: 500 },
];

const TITLE_ITEMS = [
  { name: "Rookie Chaos", cost: 0 },
  { name: "Speed Demon ⚡", cost: 150 },
  { name: "Mind Master 🧠", cost: 300 },
  { name: "Chaos Sovereign 👑", cost: 600 },
];

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("id, username, xp, wins, total_matches, is_guest, title, frame_color")
        .eq("id", session.user.id)
        .single();

      if (data) {
        setProfile({
          ...data,
          title: data.title || "Rookie Chaos",
          frame_color: data.frame_color || "border-white/10",
        });
      }
      setLoading(false);
    }

    loadProfile();
  }, []);

  const handleEquipFrame = async (frameClass: string, cost: number) => {
    if (!profile) return;
    sounds.playClick();

    if (profile.xp < cost) {
      alert("XP kamu tidak cukup untuk membeli bingkai ini!");
      return;
    }

    setUpdating(true);
    const newXp = profile.xp >= cost && frameClass !== profile.frame_color ? profile.xp - cost : profile.xp;

    const { error } = await supabase
      .from("profiles")
      .update({ frame_color: frameClass, xp: newXp })
      .eq("id", profile.id);

    if (!error) {
      setProfile({ ...profile, frame_color: frameClass, xp: newXp });
      sounds.playSuccess();
    }
    setUpdating(false);
  };

  const handleEquipTitle = async (titleName: string, cost: number) => {
    if (!profile) return;
    sounds.playClick();

    if (profile.xp < cost) {
      alert("XP kamu tidak cukup untuk membeli Gelar ini!");
      return;
    }

    setUpdating(true);
    const newXp = profile.xp >= cost && titleName !== profile.title ? profile.xp - cost : profile.xp;

    const { error } = await supabase
      .from("profiles")
      .update({ title: titleName, xp: newXp })
      .eq("id", profile.id);

    if (!error) {
      setProfile({ ...profile, title: titleName, xp: newXp });
      sounds.playSuccess();
    }
    setUpdating(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-textMuted">Memuat Profil...</p>
      </div>
    );
  }

  if (!profile) return null;

  const currentXp = profile.xp || 0;
  const level = Math.floor(currentXp / 100) + 1;
  const xpProgress = currentXp % 100;
  const winRate = profile.total_matches > 0 ? Math.round((profile.wins / profile.total_matches) * 100) : 0;

  // LOGIKA UNLOCK BADGES
  const achievements = [
    { title: "First Blood", desc: "Menangkan 1 pertandingan", unlocked: profile.wins >= 1, icon: "⚔️" },
    { title: "Veteran Fighter", desc: "Mainkan 5 pertandingan", unlocked: profile.total_matches >= 5, icon: "🎮" },
    { title: "XP Collector", desc: "Kumpulkan total 200 XP", unlocked: currentXp >= 200, icon: "⚡" },
    { title: "Champion", desc: "Raih 5 kemenangan", unlocked: profile.wins >= 5, icon: "👑" },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-6">
      <button 
        onClick={() => router.push("/")} 
        className="flex items-center gap-2 text-textMuted hover:text-white transition-colors text-sm font-semibold"
      >
        <ArrowLeft className="w-4 h-4" /> Kembali ke Home
      </button>

      {/* HEADER CARD PROFIL */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-6 md:p-8 relative overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          {/* AVATAR DENGAN BINGKAI DINAMIS */}
          <div className={`w-20 h-20 rounded-2xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-3xl font-black text-white border-2 transition-all ${profile.frame_color}`}>
            {profile.username?.[0]?.toUpperCase() || "P"}
          </div>

          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl font-black text-white">{profile.username}</h1>
              {profile.is_guest ? (
                <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded font-mono font-bold">Guest</span>
              ) : (
                <ShieldCheck className="w-5 h-5 text-secondary" />
              )}
            </div>

            <p className="text-xs text-primary font-bold tracking-wide uppercase flex items-center justify-center sm:justify-start gap-1">
              <Sparkles className="w-3.5 h-3.5" /> {profile.title}
            </p>

            {/* LEVEL & PROGRESS BAR */}
            <div className="pt-2 max-w-xs mx-auto sm:mx-0">
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-secondary">Level {level}</span>
                <span className="text-textMuted">{xpProgress}/100 XP</span>
              </div>
              <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden p-0.5">
                <div 
                  className="h-full bg-gradient-to-r from-primary via-accent to-secondary rounded-full transition-all duration-500"
                  style={{ width: `${xpProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* GRID STATISTIK */}
        <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-white/10 text-center">
          <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
            <span className="text-xs text-textMuted font-medium block">Total Match</span>
            <span className="text-xl font-black text-white">{profile.total_matches}</span>
          </div>
          <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
            <span className="text-xs text-textMuted font-medium block">Total Win</span>
            <span className="text-xl font-black text-yellow-400">{profile.wins}</span>
          </div>
          <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
            <span className="text-xs text-textMuted font-medium block">Win Rate</span>
            <span className="text-xl font-black text-secondary">{winRate}%</span>
          </div>
        </div>
      </motion.div>

      {/* SECTION LENCANA ACHIEVEMENT */}
      <div className="glass-panel p-6 space-y-4">
        <h2 className="text-base font-bold flex items-center gap-2">
          <Award className="w-5 h-5 text-yellow-400" /> Pencapaian (Badges)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {achievements.map((item) => (
            <div 
              key={item.title} 
              className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
                item.unlocked 
                  ? "bg-yellow-500/10 border-yellow-500/30 text-white" 
                  : "bg-white/5 border-white/10 opacity-50 grayscale"
              }`}
            >
              <span className="text-2xl">{item.icon}</span>
              <div>
                <div className="font-bold text-sm flex items-center gap-1.5">
                  {item.title}
                  {item.unlocked && <Check className="w-4 h-4 text-yellow-400" />}
                </div>
                <div className="text-xs text-textMuted">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION XP SHOP (BINGKAI & GELAR) */}
      <div className="glass-panel p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h2 className="text-base font-bold flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-accent" /> XP Shop
          </h2>
          <span className="text-xs font-black text-secondary flex items-center gap-1 bg-secondary/10 border border-secondary/20 px-3 py-1 rounded-full">
            <Zap className="w-3.5 h-3.5 fill-current" /> {currentXp} XP Sisa
          </span>
        </div>

        {/* BINGKAI AVATAR */}
        <div className="space-y-3">
          <span className="text-xs text-textMuted font-bold uppercase tracking-wider block">Gaya Bingkai Avatar</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FRAME_ITEMS.map((frame) => {
              const isEquipped = profile.frame_color === frame.colorClass;

              return (
                <button
                  key={frame.id}
                  disabled={updating}
                  onClick={() => handleEquipFrame(frame.colorClass, frame.cost)}
                  className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                    isEquipped ? "bg-accent/20 border-accent" : "bg-white/5 border-white/10 hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg bg-primary/20 border-2 ${frame.colorClass}`} />
                    <div className="text-left">
                      <div className="text-xs font-bold">{frame.name}</div>
                      <div className="text-[10px] text-textMuted">{frame.cost === 0 ? "Gratis" : `${frame.cost} XP`}</div>
                    </div>
                  </div>
                  {isEquipped ? <Check className="w-4 h-4 text-accent" /> : <span className="text-xs text-secondary font-bold">Pakai</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* GELAR/TITLE */}
        <div className="space-y-3 pt-3 border-t border-white/10">
          <span className="text-xs text-textMuted font-bold uppercase tracking-wider block">Gelar/Title Profil</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TITLE_ITEMS.map((t) => {
              const isEquipped = profile.title === t.name;

              return (
                <button
                  key={t.name}
                  disabled={updating}
                  onClick={() => handleEquipTitle(t.name, t.cost)}
                  className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                    isEquipped ? "bg-primary/20 border-primary" : "bg-white/5 border-white/10 hover:bg-white/10"
                  }`}
                >
                  <div className="text-left">
                    <div className="text-xs font-bold">{t.name}</div>
                    <div className="text-[10px] text-textMuted">{t.cost === 0 ? "Gratis" : `${t.cost} XP`}</div>
                  </div>
                  {isEquipped ? <Check className="w-4 h-4 text-primary" /> : <span className="text-xs text-secondary font-bold">Pakai</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}