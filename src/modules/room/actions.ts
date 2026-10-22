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

export async function joinRoom(roomCode: string, nickname: string) {
  const supabase = createClient();
  const { userId } = await getOrCreateGuestProfile(nickname);

  // 1. Cari room berdasarkan kode
  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .select("id, max_players, status")
    .eq("code", roomCode.toUpperCase())
    .single();

  if (roomError || !room) throw new Error("Kode room tidak ditemukan.");
  if (room.status !== "waiting") throw new Error("Room sedang dalam permainan.");

  // 2. Periksa jumlah pemain saat ini
  const { count, error: countError } = await supabase
    .from("room_players")
    .select("*", { count: "exact", head: true })
    .eq("room_id", room.id);

  if (countError) throw new Error("Gagal memeriksa kapasitas room.");
  if (count && count >= room.max_players) throw new Error("Room sudah penuh!");

  // 3. Masukkan pemain ke room_players
  const { error: joinError } = await supabase
    .from("room_players")
    .upsert({
      room_id: room.id,
      player_id: userId,
      is_ready: false,
    }, { onConflict: "room_id,player_id" });

  if (joinError) throw new Error(`Gagal bergabung: ${joinError.message}`);

  return roomCode;
}