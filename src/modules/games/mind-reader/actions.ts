import { createClient } from "@/lib/supabase/client";

export interface MindReaderState {
  round: number;
  maxRounds: number;
  phase: "answering" | "reveal" | "result";
  currentQuestion: {
    id: string;
    content: string;
    options: string[];
  } | null;
  submissions: Record<string, string>; // playerId -> answer
  scores: Record<string, number>;
  playerOrder: string[];
}

// 1. Host Memulai Game Mind Reader
export async function startMindReader(roomId: string, players: { player_id: string }[]) {
  const supabase = createClient();
  const playerIds = players.map((p) => p.player_id);

  const initialScores: Record<string, number> = {};
  playerIds.forEach((id) => (initialScores[id] = 0));

  // Ambil pertanyaan pertama secara acak
  const { data: questions, error } = await supabase
    .from("questions")
    .select("id, content, options")
    .eq("game_id", "mind-reader");

  if (error || !questions || questions.length === 0) {
    throw new Error("Gagal mengambil pertanyaan Mind Reader.");
  }

  const firstQuestion = questions[Math.floor(Math.random() * questions.length)];

  const initialState: MindReaderState = {
    round: 1,
    maxRounds: 4, // 4 ronde per game
    phase: "answering",
    currentQuestion: {
      id: firstQuestion.id,
      content: firstQuestion.content,
      options: typeof firstQuestion.options === "string" ? JSON.parse(firstQuestion.options) : firstQuestion.options,
    },
    submissions: {},
    scores: initialScores,
    playerOrder: playerIds,
  };

  const { error: updateError } = await supabase
    .from("rooms")
    .update({
      status: "playing",
      current_game_id: "mind-reader",
      game_state: initialState as any,
    })
    .eq("id", roomId);

  if (updateError) throw new Error(`Gagal memulai Mind Reader: ${updateError.message}`);
}

// 2. Pemain Mengunci/Kirim Jawaban Privat
export async function submitMindAnswer(roomId: string, playerId: string, answer: string, currentState: MindReaderState) {
  const supabase = createClient();

  const updatedSubmissions = {
    ...currentState.submissions,
    [playerId]: answer,
  };

  // Cek apakah seluruh pemain dalam room sudah mengunci jawaban
  const allSubmitted = currentState.playerOrder.every((id) => updatedSubmissions[id] !== undefined);

  let newPhase = currentState.phase;
  let updatedScores = { ...currentState.scores };

  // Jika semua sudah kirim, hitung kecocokan & ubah ke phase "reveal"
  if (allSubmitted) {
    newPhase = "reveal";

    // Hitung berapa kali setiap jawaban dipilih
    const answerCounts: Record<string, number> = {};
    Object.values(updatedSubmissions).forEach((ans) => {
      answerCounts[ans] = (answerCounts[ans] || 0) + 1;
    });

    // Pemain yang memilih jawaban yang dipilih >= 2 orang dapat +15 poin
    Object.entries(updatedSubmissions).forEach(([pId, ans]) => {
      if (answerCounts[ans] >= 2) {
        updatedScores[pId] = (updatedScores[pId] || 0) + 15;
      }
    });
  }

  const updatedState: MindReaderState = {
    ...currentState,
    submissions: updatedSubmissions,
    phase: newPhase,
    scores: updatedScores,
  };

  const { error } = await supabase
    .from("rooms")
    .update({ game_state: updatedState as any })
    .eq("id", roomId);

  if (error) throw new Error(`Gagal menyimpan jawaban: ${error.message}`);
}

// 3. Lanjut ke Ronde Berikutnya (Dipanggil oleh Host)
export async function nextMindReaderRound(roomId: string, currentState: MindReaderState) {
  const supabase = createClient();

  if (currentState.round >= currentState.maxRounds) {
    // Game Selesai
    const { error } = await supabase
      .from("rooms")
      .update({
        status: "finished",
        game_state: { ...currentState, phase: "result" } as any,
      })
      .eq("id", roomId);

    if (error) throw new Error(`Gagal mengakhiri game: ${error.message}`);
    return;
  }

  // Ambil pertanyaan acak baru
  const { data: questions } = await supabase
    .from("questions")
    .select("id, content, options")
    .eq("game_id", "mind-reader");

  if (!questions) return;
  const nextQuestion = questions[Math.floor(Math.random() * questions.length)];

  const updatedState: MindReaderState = {
    ...currentState,
    round: currentState.round + 1,
    phase: "answering",
    currentQuestion: {
      id: nextQuestion.id,
      content: nextQuestion.content,
      options: typeof nextQuestion.options === "string" ? JSON.parse(nextQuestion.options) : nextQuestion.options,
    },
    submissions: {},
  };

  const { error } = await supabase
    .from("rooms")
    .update({ game_state: updatedState as any })
    .eq("id", roomId);

  if (error) throw new Error(`Gagal lanjut ronde: ${error.message}`);
}