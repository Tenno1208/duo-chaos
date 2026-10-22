"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { LogIn, UserPlus, ShieldCheck, ArrowLeft, Loader2 } from "lucide-react";

export default function AuthPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  
  const [isGuestUser, setIsGuestUser] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function checkCurrentSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.is_anonymous) {
        setIsGuestUser(true);
        setMode("register"); // Defaultkan ke register biar guest bisa upgrade akun
      }
    }
    checkCurrentSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/profile");
      } else {
        // Mode Register
        if (isGuestUser) {
          // 1. Upgrade Akun Guest saat ini ke Akun Permanen
          const { error: updateAuthErr } = await supabase.auth.updateUser({
            email,
            password,
          });
          if (updateAuthErr) throw updateAuthErr;

          // 2. Update status profiles
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            await supabase.from("profiles").update({
              username: username || "Player",
              is_guest: false,
            }).eq("id", session.user.id);
          }
        } else {
          // Register Akun Baru dari Nol
          const { data, error: signUpErr } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { username },
            },
          });
          if (signUpErr) throw signUpErr;

          if (data.user) {
            await supabase.from("profiles").upsert({
              id: data.user.id,
              username: username || "Player",
              is_guest: false,
            });
          }
        }

        router.push("/profile");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal melakukan autentikasi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-auto py-8 w-full">
      <button 
        onClick={() => router.push("/")} 
        className="flex items-center gap-2 text-textMuted hover:text-white transition-colors text-sm font-semibold mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Kembali ke Home
      </button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6 md:p-8 space-y-6">
        
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-primary/20 text-primary rounded-2xl border border-primary/30 mb-2">
            {mode === "login" ? <LogIn className="w-6 h-6" /> : <UserPlus className="w-6 h-6" />}
          </div>
          <h1 className="text-2xl font-black">
            {isGuestUser ? "Simpan Akun Guest Kamu" : mode === "login" ? "Welcome Back!" : "Buat Akun Permanent"}
          </h1>
          <p className="text-xs text-textMuted">
            {isGuestUser 
              ? "Ubah akun guest kamu jadi permanent biar progres level & XP tersimpan selamanya!" 
              : "Masuk untuk melihat riwayat pertandingan dan statistik kamu."}
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-xl text-red-200 text-xs text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-textMuted">Username / Nickname</label>
              <input 
                type="text" 
                required
                maxLength={15}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username..." 
                className="input-neon text-sm"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-textMuted">Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com" 
              className="input-neon text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-textMuted">Password</label>
            <input 
              type="password" 
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" 
              className="input-neon text-sm"
            />
          </div>

          <button type="submit" disabled={loading} className="w-full btn-primary py-3 text-sm mt-2">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : mode === "login" ? "Login" : "Daftar & Simpan Progres"}
          </button>
        </form>

        {!isGuestUser && (
          <div className="text-center pt-2 border-t border-white/10">
            <button 
              onClick={() => { setMode(mode === "login" ? "register" : "login"); setErrorMsg(""); }}
              className="text-xs text-secondary hover:underline font-semibold"
            >
              {mode === "login" ? "Belum punya akun? Buat akun baru" : "Sudah punya akun? Login di sini"}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}