import { createClient } from "@/lib/supabase/client";

export interface ImpostorWordState {
  round: number;
  maxRounds: number;
  phase: "clue" | "voting" | "reveal" | "result";
  secretWord: string;
  impostorWord: string;
  impostorId: string;
  clues: Record<string, string>; // playerId -> clueText
  votes: Record<string, string>; // voterId -> targetPlayerId
  scores: Record<string, number>;
  playerOrder: string[];
}

export async function startImpostorWord(roomId: string, players: { player_id: string }[]) {
  const supabase = createClient();
  const playerIds = players.map((p) => p.player_id);

  const initialScores: Record<string, number> = {};
  playerIds.forEach((id) => (initialScores[id] = 0));

  const { data: questions, error } = await supabase
    .from("questions")
    .select("content")
    .eq("game_id", "impostor-word");

  if (error || !questions || questions.length === 0) {
    throw new Error("Gagal mengambil kata rahasia dari database.");
  }

  const q = questions[Math.floor(Math.random() * questions.length)];
  const parsed = typeof q.content === "string" ? JSON.parse(q.content) : q.content;

  // Pilih 1 pemain acak jadi Impostor
  const randomImpostorId = playerIds[Math.floor(Math.random() * playerIds.length)];

  const initialState: ImpostorWordState = {
    round: 1,
    maxRounds: 3,
    phase: "clue",
    secretWord: parsed.secret,
    impostorWord: parsed.impostor,
    impostorId: randomImpostorId,
    clues: {},
    votes: {},
    scores: initialScores,
    playerOrder: playerIds,
  };

  const { error: updateError } = await supabase
    .from("rooms")
    .update({
      status: "playing",
      current_game_id: "impostor-word",
      game_state: initialState as any,
    })
    .eq("id", roomId);

  if (updateError) throw new Error(`Gagal memulai game: ${updateError.message}`);
}

export async function submitClue(
  roomId: string,
  playerId: string,
  clueText: string,
  currentState: ImpostorWordState
) {
  const supabase = createClient();

  const updatedClues = {
    ...currentState.clues,
    [playerId]: clueText,
  };

  const allSubmitted = currentState.playerOrder.every((id) => updatedClues[id] !== undefined);

  const updatedState: ImpostorWordState = {
    ...currentState,
    clues: updatedClues,
    phase: allSubmitted ? "voting" : "clue",
  };

  const { error } = await supabase
    .from("rooms")
    .update({ game_state: updatedState as any })
    .eq("id", roomId);

  if (error) throw new Error(`Gagal menyimpan petunjuk: ${error.message}`);
}

export async function submitImpostorVote(
  roomId: string,
  voterId: string,
  targetPlayerId: string,
  currentState: ImpostorWordState
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

    // Hitung perolehan vote
    const voteCounts: Record<string, number> = {};
    Object.values(updatedVotes).forEach((targetId) => {
      voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
    });

    let maxVotes = 0;
    let votedOutId = "";
    Object.entries(voteCounts).forEach(([targetId, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        votedOutId = targetId;
      }
    });

    const impostorCaught = votedOutId === currentState.impostorId;

    if (impostorCaught) {
      // Warga menang: +20 poin buat pemain biasa
      currentState.playerOrder.forEach((id) => {
        if (id !== currentState.impostorId) {
          updatedScores[id] = (updatedScores[id] || 0) + 20;
        }
      });
    } else {
      // Impostor lolos: Impostor dapet +40 poin
      updatedScores[currentState.impostorId] = (updatedScores[currentState.impostorId] || 0) + 40;
    }
  }

  const updatedState: ImpostorWordState = {
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

export async function nextImpostorRound(roomId: string, currentState: ImpostorWordState) {
  const supabase = createClient();

  if (currentState.round >= currentState.maxRounds) {
    await supabase
      .from("rooms")
      .update({
        status: "finished",
        game_state: { ...currentState, phase: "result" } as any,
      })
      .eq("id", roomId);
    return;
  }

  const { data: questions } = await supabase
    .from("questions")
    .select("content")
    .eq("game_id", "impostor-word");

  if (!questions || questions.length === 0) return;
  const q = questions[Math.floor(Math.random() * questions.length)];
  const parsed = typeof q.content === "string" ? JSON.parse(q.content) : q.content;

  const randomImpostorId = currentState.playerOrder[Math.floor(Math.random() * currentState.playerOrder.length)];

  const updatedState: ImpostorWordState = {
    ...currentState,
    round: currentState.round + 1,
    phase: "clue",
    secretWord: parsed.secret,
    impostorWord: parsed.impostor,
    impostorId: randomImpostorId,
    clues: {},
    votes: {},
  };

  await supabase
    .from("rooms")
    .update({ game_state: updatedState as any })
    .eq("id", roomId);
}