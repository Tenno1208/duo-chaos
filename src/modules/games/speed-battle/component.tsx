"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { SpeedBattleState, submitSpeedAnswer, nextSpeedBattleRound, revealSpeedBattleRound } from "./actions";
import { Zap, Check, X, Timer, Award, ArrowRight, Loader2 } from "lucide-react";

interface Props {
  roomId: string;
  currentUserId: string;
  hostId: string;
  gameState: SpeedBattleState;
  players: { player_id: string; profiles: { username: string } }[];
}

export default function SpeedBattleGame({ roomId, currentUserId, hostId, gameState, players }: Props) {
  const [timeLeft, setTimeLeft] = useState(10);
  const [loading, setLoading] = useState(false);
  const isHost = currentUserId === hostId;

  const mySubmission = gameState.submissions[currentUserId];
  const hasSubmitted = mySubmission !== undefined;

  // Countdown Timer Client Side Sync
  useEffect(() => {
    if (gameState.phase !== "question") return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - gameState.roundStartTime) / 1000);
      const remaining = Math.max(0, gameState.timeLimitSeconds - elapsed);
      setTimeLeft(remaining);

      // Jika waktu habis dan user adalah Host, pemicu reveal di-trigger
      if (remaining <= 0 && isHost) {
        clearInterval(interval);
        revealSpeedBattleRound(roomId, gameState);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [gameState.phase, gameState.roundStartTime, isHost, roomId]);

  const handleSelectOption = async (option: string) => {
    if (hasSubmitted || loading || gameState.phase !== "question") return;
    setLoading(true);

    try {
      await submitSpeedAnswer(roomId, currentUserId, option, gameState);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNextRound = async () => {
    setLoading(true);
    try {
      await nextSpeedBattleRound(roomId, gameState);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* HEADER STATUS */}
      <div className="glass-panel p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-6 h-6 text-yellow-400" />
          <span className="font-bold text-lg">Speed Battle</span>
        </div>
        
        {/* TIMER BAR */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 px-3 py-1 rounded-xl text-yellow-400 font-mono font-bold text-sm">
            <Timer className="w-4 h-4 animate-spin" />
            <span>{timeLeft}s</span>
          </div>
          <span className="text-xs bg-white/10 px-3 py-1 rounded-full text-textMuted font-medium">
            Round {gameState.round} / {gameState.maxRounds}
          </span>
        </div>
      </div>

      {/* QUESTION CARD */}
      <div className="glass-panel p-6 md:p-8 space-y-6 text-center relative overflow-hidden">
        {/* PROGRESS TIMER LINE */}
        {gameState.phase === "question" && (
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-white/10">
            <div
              className="h-full bg-gradient-to-r from-yellow-400 to-accent transition-all duration-300"
              style={{ width: `${(timeLeft / gameState.timeLimitSeconds) * 100}%` }}
            />
          </div>
        )}

        <h2 className="text-xl md:text-2xl font-extrabold text-white leading-snug">
          "{gameState.currentQuestion?.content}"
        </h2>

        {/* PHASE 1: QUESTION */}
        {gameState.phase === "question" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
              {gameState.currentQuestion?.options.map((opt, idx) => {
                const isSelected = mySubmission?.answer === opt;

                return (
                  <button
                    key={idx}
                    disabled={hasSubmitted || loading}
                    onClick={() => handleSelectOption(opt)}
                    className={`p-4 rounded-xl text-left border font-semibold transition-all flex items-center justify-between ${
                      isSelected
                        ? "bg-yellow-500/20 border-yellow-400 text-white shadow-[0_0_15px_rgba(234,179,8,0.3)]"
                        : "bg-white/5 border-white/10 hover:bg-white/10 text-textMuted hover:text-white"
                    }`}
                  >
                    <span>{opt}</span>
                    {isSelected && <Check className="w-5 h-5 text-yellow-400" />}
                  </button>
                );
              })}
            </div>

            <div className="pt-4 border-t border-white/10">
              <span className="text-xs uppercase tracking-wider text-textMuted font-medium block mb-2">
                Pemain Mengunci Jawaban
              </span>
              <div className="flex justify-center gap-2">
                {players.map((p) => {
                  const pSub = gameState.submissions[p.player_id];
                  return (
                    <span
                      key={p.player_id}
                      className={`text-xs px-3 py-1 rounded-lg border font-semibold ${
                        pSub
                          ? "bg-green-500/20 border-green-500/40 text-green-300"
                          : "bg-white/5 border-white/10 text-textMuted"
                      }`}
                    >
                      {p.profiles?.username} {pSub ? "✓" : "..."}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* PHASE 2: ROUND RESULT */}
        {gameState.phase === "round_result" && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
            <div className="p-3 bg-green-500/20 border border-green-500/40 rounded-xl text-green-300 text-sm font-bold inline-block">
              Jawaban Benar: <strong className="text-white text-base">"{gameState.currentQuestion?.correctAnswer}"</strong>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
              {players.map((p) => {
                const sub = gameState.submissions[p.player_id];
                const isMe = p.player_id === currentUserId;

                return (
                  <div
                    key={p.player_id}
                    className={`p-4 rounded-xl border flex items-center justify-between ${
                      sub?.isCorrect
                        ? "bg-green-500/10 border-green-500/40"
                        : "bg-red-500/10 border-red-500/40"
                    } ${isMe ? "ring-2 ring-primary" : ""}`}
                  >
                    <div className="text-left">
                      <div className="font-semibold text-sm flex items-center gap-1.5">
                        {p.profiles?.username}
                        {sub?.isCorrect ? <Check className="w-4 h-4 text-green-400" /> : <X className="w-4 h-4 text-red-400" />}
                      </div>
                      <div className="text-xs text-textMuted">
                        {sub ? `"${sub.answer}" (${(sub.timeTakenMs / 1000).toFixed(1)}s)` : "Waktu Habis"}
                      </div>
                    </div>

                    <span className={`font-bold ${sub?.isCorrect ? "text-green-400" : "text-red-400"}`}>
                      +{sub?.pointsGained || 0} pts
                    </span>
                  </div>
                );
              })}
            </div>

            {isHost ? (
              <button disabled={loading} onClick={handleNextRound} className="btn-primary w-full max-w-xs mx-auto py-3">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Lanjut Ronde <ArrowRight className="w-4 h-4" /></>}
              </button>
            ) : (
              <p className="text-sm text-textMuted italic">Menunggu Host melanjutkan ronde...</p>
            )}
          </motion.div>
        )}
      </div>

      {/* SCOREBOARD */}
      <div className="glass-panel p-4">
        <h3 className="text-sm font-bold text-textMuted mb-3 flex items-center gap-2">
          <Award className="w-4 h-4 text-yellow-400" /> Papan Skor Sementara
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {players.map((p) => (
            <div key={p.player_id} className="bg-white/5 border border-white/10 p-3 rounded-xl flex justify-between items-center">
              <span className="text-sm font-semibold truncate">{p.profiles?.username}</span>
              <span className="font-bold text-secondary">{gameState.scores[p.player_id] || 0} pts</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}