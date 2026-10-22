"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Gamepad2, LogIn, LogOut, ShieldCheck, Trophy, ShieldAlert } from "lucide-react";

interface UserProfile {
  username: string;
  is_guest: boolean;
  is_admin?: boolean;
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    async function loadUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Mengambil username, status guest, dan status admin
        const { data } = await supabase
          .from("profiles")
          .select("username, is_guest, is_admin")
          .eq("id", session.user.id)
          .single();

        if (data) setUserProfile(data as UserProfile);
      } else {
        setUserProfile(null);
      }
    }

    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadUser();
    });

    return () => subscription.unsubscribe();
  }, [pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserProfile(null);
    router.push("/");
  };

  if (pathname.startsWith("/room/")) return null;

  return (
    <header className="w-full bg-background/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
      <div className="container mx-auto max-w-4xl px-3 sm:px-4 h-16 flex items-center justify-between gap-2">
        
        {/* LOGO BRAND */}
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <div className="p-1.5 sm:p-2 bg-primary/20 rounded-xl border border-primary/30 group-hover:scale-105 transition-transform">
            <Gamepad2 className="w-5 h-5 text-primary" />
          </div>
          <span className="font-black text-base sm:text-lg tracking-wider text-white">
            DUO <span className="text-secondary">CHAOS</span>
          </span>
        </Link>

        {/* NAVIGASI & AKSI USER */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          
          {/* TOMBOL LEADERBOARD */}
          <Link
            href="/leaderboard"
            className="p-2 sm:px-3 sm:py-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0"
            title="Leaderboard"
          >
            <Trophy className="w-4 h-4 shrink-0" />
            <span className="hidden md:inline">Leaderboard</span>
          </Link>

          {/* TOMBOL ADMIN PANEL (Hanya tampil jika user is_admin = true) */}
          {userProfile?.is_admin && (
            <Link
              href="/admin"
              className="p-2 sm:px-3 sm:py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0"
              title="Admin Panel"
            >
              <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
              <span className="hidden md:inline">Admin</span>
            </Link>
          )}

          {/* USER PROFILE & LOGOUT / LOGIN */}
          {userProfile ? (
            <div className="flex items-center gap-1 sm:gap-2">
              <Link 
                href="/profile"
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 p-1.5 sm:px-3 sm:py-1.5 rounded-xl transition-all"
              >
                <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-xs font-bold text-white shrink-0">
                  {userProfile.username?.[0]?.toUpperCase() || "P"}
                </div>
                <span className="text-xs font-semibold text-white max-w-[70px] sm:max-w-[100px] truncate hidden sm:inline-block">
                  {userProfile.username}
                </span>
                {userProfile.is_guest ? (
                  <span className="hidden sm:inline-block text-[9px] bg-yellow-500/20 text-yellow-400 px-1 py-0.5 rounded font-mono">Guest</span>
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5 text-secondary shrink-0 hidden sm:block" />
                )}
              </Link>

              <button 
                onClick={handleLogout}
                className="p-2 text-textMuted hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors shrink-0"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link href="/login" className="btn-primary py-1.5 px-3 text-xs shrink-0">
              <LogIn className="w-4 h-4" /> <span className="hidden sm:inline">Login</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}