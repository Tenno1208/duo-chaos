"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Gamepad2, User, LogIn, LogOut, ShieldCheck } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const [userProfile, setUserProfile] = useState<{ username: string; is_guest: boolean } | null>(null);

  useEffect(() => {
    async function loadUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data } = await supabase
          .from("profiles")
          .select("username, is_guest")
          .eq("id", session.user.id)
          .single();

        if (data) setUserProfile(data);
      } else {
        setUserProfile(null);
      }
    }

    loadUser();

    // Listen perubahan auth
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

  // Sembunyikan navbar jika sedang di dalam room game biar layar HP lega
  if (pathname.startsWith("/room/")) return null;

  return (
    <header className="w-full bg-background/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
      <div className="container mx-auto max-w-4xl px-4 h-16 flex items-center justify-between">
        
        {/* LOGO BRAND */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="p-2 bg-primary/20 rounded-xl border border-primary/30 group-hover:scale-105 transition-transform">
            <Gamepad2 className="w-5 h-5 text-primary" />
          </div>
          <span className="font-black text-lg tracking-wider text-white">
            DUO <span className="text-secondary">CHAOS</span>
          </span>
        </Link>

        {/* PROFILE & AUTH ACTION */}
        <div className="flex items-center gap-3">
          {userProfile ? (
            <div className="flex items-center gap-3">
              <Link 
                href="/profile"
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-xl transition-all"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-xs font-bold text-white">
                  {userProfile.username?.[0]?.toUpperCase() || "P"}
                </div>
                <span className="text-sm font-semibold text-white max-w-[100px] truncate">
                  {userProfile.username}
                </span>
                {userProfile.is_guest ? (
                  <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded font-mono">
                    Guest
                  </span>
                ) : (
                  <ShieldCheck className="w-4 h-4 text-secondary" />
                )}
              </Link>

              <button 
                onClick={handleLogout}
                className="p-2 text-textMuted hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link href="/login" className="btn-primary py-2 px-4 text-xs">
              <LogIn className="w-4 h-4" /> Login / Register
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}