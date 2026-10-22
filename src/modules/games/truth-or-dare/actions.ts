import { createClient } from "@/lib/supabase/client";

export interface TruthOrDareState {
  activePlayerId: string;
  round: number;
  maxRounds: number;
  phase: "choosing" | "answering" | "result";
  currentChoice: "truth" | "dare" | null;
  currentPrompt: string | null;
  scores: Record<string, number>;
  playerOrder: string[];
}

// 1. Host Memulai Game
export async function startTruthOrDare(roomId: string, players: { player_id: string }[]) {
  const supabase = createClient();
  const playerIds = players.map((p) => p.player_id);

  const initialScores: Record<string, number> = {};
  playerIds.forEach((id) => (initialScores[id] = 0));

  const initialState: TruthOrDareState = {
    activePlayerId: playerIds[0],
    round: 1,
    maxRounds: playerIds.length * 2,
    phase: "choosing",
    currentChoice: null,
    currentPrompt: null,
    scores: initialScores,
    playerOrder: playerIds,
  };

  const { error } = await supabase
    .from("rooms")
    .update({
      status: "playing",
      current_game_id: "truth-or-dare",
      game_state: initialState as any,
    })
    .eq("id", roomId);

  if (error) throw new Error(`Gagal memulai game: ${error.message}`);
}

// 2. Pemain Aktif Memilih Truth atau Dare
export async function selectTruthOrDareChoice(roomId: string, choice: "truth" | "dare", currentState: TruthOrDareState) {
  const supabase = createClient();

  const { data: questions, error } = await supabase
    .from("questions")
    .select("content")
    .eq("game_id", "truth-or-dare")
    .eq("type", choice);

  if (error || !questions || questions.length === 0) {
    throw new Error("Gagal mengambil pertanyaan dari database.");
  }

  const randomPrompt = questions[Math.floor(Math.random() * questions.length)].content;

  const updatedState: TruthOrDareState = {
    ...currentState,
    phase: "answering",
    currentChoice: choice,
    currentPrompt: randomPrompt,
  };

  const { error: updateError } = await supabase
    .from("rooms")
    .update({ game_state: updatedState as any })
    .eq("id", roomId);

  if (updateError) throw new Error(`Gagal update game state: ${updateError.message}`);
}

// 3. Menyelesaikan atau Melewati Giliran
export async function completeTurn(roomId: string, currentState: TruthOrDareState, skipped: boolean) {
  const supabase = createClient();

  const updatedScores = { ...currentState.scores };
  if (!skipped) {
    updatedScores[currentState.activePlayerId] = (updatedScores[currentState.activePlayerId] || 0) + 10;
  }

  const currentIndex = currentState.playerOrder.indexOf(currentState.activePlayerId);
  const nextIndex = (currentIndex + 1) % currentState.playerOrder.length;
  const isFinished = currentState.round >= currentState.maxRounds && nextIndex === 0;

  if (isFinished) {
    const { error } = await supabase
      .from("rooms")
      .update({
        status: "finished",
        game_state: { ...currentState, scores: updatedScores, phase: "result" } as any,
      })
      .eq("id", roomId);

    if (error) throw new Error(`Gagal menyelesaikan pertandingan: ${error.message}`);
  } else {
    const updatedState: TruthOrDareState = {
      ...currentState,
      round: currentState.round + 1,
      activePlayerId: currentState.playerOrder[nextIndex],
      phase: "choosing",
      currentChoice: null,
      currentPrompt: null,
      scores: updatedScores,
    };

    const { error } = await supabase
      .from("rooms")
      .update({ game_state: updatedState as any })
      .eq("id", roomId);

    if (error) throw new Error(`Gagal lanjut ke ronde berikutnya: ${error.message}`);
  }
}