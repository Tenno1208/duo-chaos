import { createClient } from "@/lib/supabase/client";

export interface MostLikelyToState {
  round: number;
  maxRounds: number;
  phase: "voting" | "reveal" | "result";
  currentQuestion: {
    id: string;
    content: string;
  } | null;
  votes: Record<string, string>; // voterPlayerId -> votedTargetPlayerId
  scores: Record<string, number>;
  playerOrder: string[];
}

// 1. Host Memulai Game Most Likely To
export async function startMostLikelyTo(roomId: string, players: { player_id: string }[]) {
  const supabase = createClient();
  const playerIds = players.map((p) => p.player_id);

  const initialScores: Record<string, number> = {};
  playerIds.forEach((id) => (initialScores[id] = 0));

  const { data: questions, error } = await supabase
    .from("questions")
    .select("id, content")
    .eq("game_id", "most-likely-to");

  if (error || !questions || questions.length === 0) {
    throw new Error("Gagal mengambil pertanyaan Most Likely To.");
  }

  const q = questions[Math.floor(Math.random() * questions.length)];

  const initialState: MostLikelyToState = {
    round: 1,
    maxRounds: 4,
    phase: "voting",
    currentQuestion: {
      id: q.id,
      content: q.content,
    },
    votes: {},
    scores: initialScores,
    playerOrder: playerIds,
  };

  const { error: updateError } = await supabase
    .from("rooms")
    .update({
      status: "playing",
      current_game_id: "most-likely-to",
      game_state: initialState as any,
    })
    .eq("id", roomId);

  if (updateError) throw new Error(`Gagal memulai Most Likely To: ${updateError.message}`);
}

// 2. Submit Vote Pemain
export async function submitVote(
  roomId: string,
  voterId: string,
  targetPlayerId: string,
  currentState: MostLikelyToState
) {
  const supabase = createClient();

  const updatedVotes = {
    ...currentState.votes,
    [voterId]: targetPlayerId,
  };

  const allVoted = currentState.playerOrder.every((id) => updatedVotes[id] !== undefined);

  let newPhase = currentState.phase;
  let updatedScores = { ...currentState.scores };

  if (allVoted) {
    newPhase = "reveal";

    // Hitung berapa vote yang didapat tiap pemain
    const voteCounts: Record<string, number> = {};
    Object.values(updatedVotes).forEach((targetId) => {
      voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
    });

    // Cari pemenang vote terbanyak
    let maxVotes = 0;
    let winners: string[] = [];
    Object.entries(voteCounts).forEach(([targetId, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        winners = [targetId];
      } else if (count === maxVotes) {
        winners.push(targetId);
      }
    });

    // Tambah skor:
    // +20 poin untuk yang menang vote
    winners.forEach((winnerId) => {
      updatedScores[winnerId] = (updatedScores[winnerId] || 0) + 20;
    });

    // +10 poin untuk yang berhasil nge-vote pemenang tersebut
    Object.entries(updatedVotes).forEach(([voterId, targetId]) => {
      if (winners.includes(targetId)) {
        updatedScores[voterId] = (updatedScores[voterId] || 0) + 10;
      }
    });
  }

  const updatedState: MostLikelyToState = {
    ...currentState,
    votes: updatedVotes,
    phase: newPhase,
    scores: updatedScores,
  };

  const { error } = await supabase
    .from("rooms")
    .update({ game_state: updatedState as any })
    .eq("id", roomId);

  if (error) throw new Error(`Gagal menyimpan vote: ${error.message}`);
}

// 3. Lanjut Ronde Berikutnya
export async function nextMostLikelyToRound(roomId: string, currentState: MostLikelyToState) {
  const supabase = createClient();

  if (currentState.round >= currentState.maxRounds) {
    const { error } = await supabase
      .from("rooms")
      .update({
        status: "finished",
        game_state: { ...currentState, phase: "result" } as any,
      })
      .eq("id", roomId);

    if (error) throw new Error(`Gagal menyelesaikan game: ${error.message}`);
    return;
  }

  const { data: questions } = await supabase
    .from("questions")
    .select("id, content")
    .eq("game_id", "most-likely-to");

  if (!questions || questions.length === 0) return;
  const q = questions[Math.floor(Math.random() * questions.length)];

  const updatedState: MostLikelyToState = {
    ...currentState,
    round: currentState.round + 1,
    phase: "voting",
    currentQuestion: {
      id: q.id,
      content: q.content,
    },
    votes: {},
  };

  const { error } = await supabase
    .from("rooms")
    .update({ game_state: updatedState as any })
    .eq("id", roomId);

  if (error) throw new Error(`Gagal lanjut ronde: ${error.message}`);
}