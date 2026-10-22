import { createClient } from "@/lib/supabase/client";

export interface SpeedBattleSubmission {
  answer: string;
  timeTakenMs: number;
  isCorrect: boolean;
  pointsGained: number;
}

export interface SpeedBattleState {
  round: number;
  maxRounds: number;
  phase: "question" | "round_result" | "result";
  currentQuestion: {
    id: string;
    content: string;
    options: string[];
    correctAnswer?: string;
  } | null;
  roundStartTime: number;
  timeLimitSeconds: number;
  submissions: Record<string, SpeedBattleSubmission>;
  scores: Record<string, number>;
  playerOrder: string[];
}

// 1. Host Memulai Game Speed Battle
export async function startSpeedBattle(roomId: string, players: { player_id: string }[]) {
  const supabase = createClient();
  const playerIds = players.map((p) => p.player_id);

  const initialScores: Record<string, number> = {};
  playerIds.forEach((id) => (initialScores[id] = 0));

  const { data: questions, error } = await supabase
    .from("questions")
    .select("id, content, options")
    .eq("game_id", "speed-battle");

  if (error || !questions || questions.length === 0) {
    throw new Error("Gagal mengambil pertanyaan Speed Battle dari database.");
  }

  const q = questions[Math.floor(Math.random() * questions.length)];

  const initialState: SpeedBattleState = {
    round: 1,
    maxRounds: 5,
    phase: "question",
    currentQuestion: {
      id: q.id,
      content: q.content,
      options: typeof q.options === "string" ? JSON.parse(q.options) : q.options,
    },
    roundStartTime: Date.now(),
    timeLimitSeconds: 10,
    submissions: {},
    scores: initialScores,
    playerOrder: playerIds,
  };

  const { error: updateError } = await supabase
    .from("rooms")
    .update({
      status: "playing",
      current_game_id: "speed-battle",
      game_state: initialState as any,
    })
    .eq("id", roomId);

  if (updateError) throw new Error(`Gagal memulai Speed Battle: ${updateError.message}`);
}

// 2. Submit Jawaban (Validasi Server-Side)
export async function submitSpeedAnswer(
  roomId: string,
  playerId: string,
  selectedAnswer: string,
  currentState: SpeedBattleState
) {
  const supabase = createClient();

  if (currentState.submissions[playerId] || currentState.phase !== "question") return;

  const now = Date.now();
  const timeTakenMs = Math.max(0, now - currentState.roundStartTime);

  const { data: qData, error: qErr } = await supabase
    .from("questions")
    .select("correct_answer")
    .eq("id", currentState.currentQuestion?.id)
    .single();

  if (qErr || !qData) throw new Error("Gagal memverifikasi jawaban di server.");

  const isCorrect = selectedAnswer === qData.correct_answer;

  let pointsGained = 0;
  if (isCorrect) {
    const timeLimitMs = currentState.timeLimitSeconds * 1000;
    const remainingRatio = Math.max(0, (timeLimitMs - timeTakenMs) / timeLimitMs);
    pointsGained = 100 + Math.round(remainingRatio * 50);
  }

  const updatedSubmissions: Record<string, SpeedBattleSubmission> = {
    ...currentState.submissions,
    [playerId]: {
      answer: selectedAnswer,
      timeTakenMs,
      isCorrect,
      pointsGained,
    },
  };

  const updatedScores = {
    ...currentState.scores,
    [playerId]: (currentState.scores[playerId] || 0) + pointsGained,
  };

  const allSubmitted = currentState.playerOrder.every((id) => updatedSubmissions[id] !== undefined);

  // Deklarasi Tipe Eksplisit
  let newPhase: SpeedBattleState["phase"] = currentState.phase;
  let updatedQuestion = currentState.currentQuestion;

  if (allSubmitted) {
    newPhase = "round_result";
    if (updatedQuestion) {
      updatedQuestion = {
        ...updatedQuestion,
        correctAnswer: qData.correct_answer,
      };
    }
  }

  const updatedState: SpeedBattleState = {
    ...currentState,
    submissions: updatedSubmissions,
    scores: updatedScores,
    phase: newPhase,
    currentQuestion: updatedQuestion,
  };

  const { error } = await supabase
    .from("rooms")
    .update({ game_state: updatedState as any })
    .eq("id", roomId);

  if (error) throw new Error(`Gagal menyimpan jawaban: ${error.message}`);
}

// 3. Trigger Waktu Habis (Timeout)
export async function revealSpeedBattleRound(roomId: string, currentState: SpeedBattleState) {
  const supabase = createClient();
  if (currentState.phase !== "question") return;

  const { data: qData } = await supabase
    .from("questions")
    .select("correct_answer")
    .eq("id", currentState.currentQuestion?.id)
    .single();

  const updatedState: SpeedBattleState = {
    ...currentState,
    phase: "round_result",
    currentQuestion: currentState.currentQuestion
      ? { ...currentState.currentQuestion, correctAnswer: qData?.correct_answer || "" }
      : null,
  };

  await supabase.from("rooms").update({ game_state: updatedState as any }).eq("id", roomId);
}

// 4. Lanjut Ronde Berikutnya
export async function nextSpeedBattleRound(roomId: string, currentState: SpeedBattleState) {
  const supabase = createClient();

  if (currentState.round >= currentState.maxRounds) {
    const { error } = await supabase
      .from("rooms")
      .update({
        status: "finished",
        game_state: { ...currentState, phase: "result" } as any,
      })
      .eq("id", roomId);

    if (error) throw new Error(`Gagal mengakhiri pertandingan: ${error.message}`);
    return;
  }

  const { data: questions } = await supabase
    .from("questions")
    .select("id, content, options")
    .eq("game_id", "speed-battle");

  if (!questions || questions.length === 0) return;
  const q = questions[Math.floor(Math.random() * questions.length)];

  const updatedState: SpeedBattleState = {
    ...currentState,
    round: currentState.round + 1,
    phase: "question",
    currentQuestion: {
      id: q.id,
      content: q.content,
      options: typeof q.options === "string" ? JSON.parse(q.options) : q.options,
    },
    roundStartTime: Date.now(),
    submissions: {},
  };

  const { error } = await supabase
    .from("rooms")
    .update({ game_state: updatedState as any })
    .eq("id", roomId);

  if (error) throw new Error(`Gagal lanjut ronde: ${error.message}`);
}