import { createClient } from "./supabase/client";

export async function getOrCreateGuestProfile(nickname: string) {
  const supabase = createClient();
  
  // 1. Ambil sesi pengguna saat ini
  let { data: { session } } = await supabase.auth.getSession();
  
  // 2. Jika belum ada sesi, buat sesi Guest (Anonymous)
  if (!session) {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw new Error(`Gagal autentikasi guest: ${error.message}`);
    session = data.session;
  }

  if (!session?.user) throw new Error("Sesi pengguna tidak valid.");

  const userId = session.user.id;

  // 3. Sync data nama ke tabel profiles
  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({
      id: userId,
      username: nickname,
      is_guest: true,
    }, { onConflict: "id" });

  if (profileError) throw new Error(`Gagal menyimpan profil: ${profileError.message}`);

  return { userId, nickname };
}