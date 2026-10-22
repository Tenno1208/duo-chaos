import { createClient } from "@/lib/supabase/client";

export interface DoodleGuessState {
  round: number;
  maxRounds: number;
  phase: "drawing" | "reveal";
  drawerId: string;
  secretWord: string;
  solvedPlayers: string[];
  scores: Record<string, number>;
  playerOrder: string[];
}

export async function startDoodleGuess(roomId: string, players: { player_id: string }[]) {
  const supabase = createClient();
  const playerIds = players.map((p) => p.player_id);

  const initialScores: Record<string, number> = {};
  playerIds.forEach((id) => (initialScores[id] = 0));

  const { data: questions, error } = await supabase
    .from("questions")
    .select("content")
    .eq("game_id", "doodle-guess");

  if (error || !questions || questions.length === 0) {
    throw new Error("Gagal mengambil kata tebak gambar dari database.");
  }

  const q = questions[Math.floor(Math.random() * questions.length)];
  const parsed = typeof q.content === "string" ? JSON.parse(q.content) : q.content;

  const firstDrawerId = playerIds[0];

  const initialState: DoodleGuessState = {
    round: 1,
    maxRounds: playerIds.length, // Tiap pemain dapet giliran gambar 1x
    phase: "drawing",
    drawerId: firstDrawerId,
    secretWord: parsed.word,
    solvedPlayers: [],
    scores: initialScores,
    playerOrder: playerIds,
  };

  const { error: updateError } = await supabase
    .from("rooms")
    .update({
      status: "playing",
      current_game_id: "doodle-guess",
      game_state: initialState as any,
    })
    .eq("id", roomId);

  if (updateError) throw new Error(`Gagal memulai game: ${updateError.message}`);
}

export async function submitDoodleGuess(
  roomId: string,
  playerId: string,
  guessInput: string,
  currentState: DoodleGuessState
) {
  const supabase = createClient();
  const isCorrect = guessInput.trim().toLowerCase() === currentState.secretWord.trim().toLowerCase();

  if (!isCorrect || currentState.solvedPlayers.includes(playerId)) return;

  const newSolved = [...currentState.solvedPlayers, playerId];
  const newScores = { ...currentState.scores };

  // Pemain yang berhasil tebak dapet 30 poin, si penggambar dapet 10 poin bonus
  newScores[playerId] = (newScores[playerId] || 0) + 30;
  newScores[currentState.drawerId] = (newScores[currentState.drawerId] || 0) + 10;

  // Cek apakah semua pemain (selain penggambar) sudah berhasil tebak
  const nonDrawers = currentState.playerOrder.filter((id) => id !== currentState.drawerId);
  const allSolved = nonDrawers.every((id) => newSolved.includes(id));

  const updatedState: DoodleGuessState = {
    ...currentState,
    solvedPlayers: newSolved,
    scores: newScores,
    phase: allSolved ? "reveal" : currentState.phase,
  };

  await supabase
    .from("rooms")
    .update({ game_state: updatedState as any })
    .eq("id", roomId);
}

export async function nextDoodleRound(roomId: string, currentState: DoodleGuessState) {
  const supabase = createClient();

  if (currentState.round >= currentState.maxRounds) {
    await supabase
      .from("rooms")
      .update({
        status: "finished",
        game_state: { ...currentState, phase: "reveal" } as any,
      })
      .eq("id", roomId);
    return;
  }

  const { data: questions } = await supabase
    .from("questions")
    .select("content")
    .eq("game_id", "doodle-guess");

  if (!questions || questions.length === 0) return;
  const q = questions[Math.floor(Math.random() * questions.length)];
  const parsed = typeof q.content === "string" ? JSON.parse(q.content) : q.content;

  const nextDrawerIndex = currentState.round % currentState.playerOrder.length;
  const nextDrawerId = currentState.playerOrder[nextDrawerIndex];

  const updatedState: DoodleGuessState = {
    ...currentState,
    round: currentState.round + 1,
    phase: "drawing",
    drawerId: nextDrawerId,
    secretWord: parsed.word,
    solvedPlayers: [],
  };

  await supabase
    .from("rooms")
    .update({ game_state: updatedState as any })
    .eq("id", roomId);
}