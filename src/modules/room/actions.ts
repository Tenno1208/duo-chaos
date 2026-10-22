import { createClient } from "@/lib/supabase/client";
import { getOrCreateGuestProfile } from "@/lib/auth";

// Helper pembuat kode unik 6 karakter
function generateRoomCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function createRoom(nickname: string, maxPlayers: number) {
  const supabase = createClient();
  const { userId } = await getOrCreateGuestProfile(nickname);

  const roomCode = generateRoomCode();

  // 1. Buat record room baru
  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .insert({
      code: roomCode,
      host_id: userId,
      max_players: maxPlayers,
      status: "waiting",
    })
    .select()
    .single();

  if (roomError) throw new Error(`Gagal membuat room: ${roomError.message}`);

  // 2. Masukkan Host ke room_players (Host otomatis Ready)
  const { error: playerError } = await supabase
    .from("room_players")
    .insert({
      room_id: room.id,
      player_id: userId,
      is_ready: true,
    });

  if (playerError) throw new Error(`Gagal mendaftarkan host: ${playerError.message}`);

  return roomCode;
}

export async function joinRoom(roomCode: string, playerName: string) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Sesi tidak ditemukan.");

  const { data: room, error } = await supabase
    .from("rooms")
    .select("id, max_players, status")
    .eq("code", roomCode.toUpperCase())
    .single();

  if (error || !room) throw new Error("Kode room tidak valid!");

  // Cek jumlah pemain aktif
  const { data: existingPlayers } = await supabase
    .from("room_players")
    .select("player_id, is_spectator")
    .eq("room_id", room.id);

  const activePlayers = existingPlayers?.filter((p) => !p.is_spectator) || [];
  const isFull = activePlayers.length >= room.max_players;

  // Masukkan ke room (Jika penuh, masuk sebagai Penonton / Spectator)
  const { error: joinError } = await supabase.from("room_players").upsert({
    room_id: room.id,
    player_id: session.user.id,
    is_ready: isFull ? true : false,
    is_spectator: isFull,
  });

  if (joinError) throw new Error("Gagal masuk ke room.");

  return roomCode.toUpperCase();
}