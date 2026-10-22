"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MindReaderState, submitMindAnswer, nextMindReaderRound } from "./actions";
import { BrainCircuit, Check, Lock, Loader2, Sparkles, Award, ArrowRight } from "lucide-react";

interface Props {
  roomId: string;
  currentUserId: string;
  hostId: string;
  gameState: MindReaderState;
  players: { player_id: string; profiles: { username: string } }[];
}

export default function MindReaderGame({ roomId, currentUserId, hostId, gameState, players }: Props) {
  const [loading, setLoading] = useState(false);
  const isHost = currentUserId === hostId;

  const mySubmission = gameState.submissions[currentUserId];
  const hasSubmitted = mySubmission !== undefined;

  const handleSelectOption = async (option: string) => {
    if (hasSubmitted || loading || gameState.phase !== "answering") return;
    setLoading(true);

    try {
      await submitMindAnswer(roomId, currentUserId, option, gameState);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNextRound = async () => {
    setLoading(true);
    try {
      await nextMindReaderRound(roomId, gameState);
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
          <BrainCircuit className="w-6 h-6 text-secondary" />
          <span className="font-bold text-lg">Mind Reader</span>
        </div>
        <span className="text-xs bg-white/10 px-3 py-1 rounded-full text-textMuted font-medium">
          Round {gameState.round} / {gameState.maxRounds}
        </span>
      </div>

      {/* QUESTION CARD */}
      <div className="glass-panel p-6 md:p-8 space-y-6 text-center">
        <h2 className="text-xl md:text-2xl font-extrabold text-white leading-snug">
          "{gameState.currentQuestion?.content}"
        </h2>

        {/* PHASE 1: ANSWERING */}
        {gameState.phase === "answering" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
              {gameState.currentQuestion?.options.map((opt, idx) => {
                const isSelected = mySubmission === opt;

                return (
                  <button
                    key={idx}
                    disabled={hasSubmitted || loading}
                    onClick={() => handleSelectOption(opt)}
                    className={`p-4 rounded-xl text-left border font-semibold transition-all flex items-center justify-between ${
                      isSelected
                        ? "bg-secondary/20 border-secondary text-white shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                        : "bg-white/5 border-white/10 hover:bg-white/10 text-textMuted hover:text-white"
                    }`}
                  >
                    <span>{opt}</span>
                    {isSelected && <Check className="w-5 h-5 text-secondary" />}
                  </button>
                );
              })}
            </div>

            {/* STATUS SUBMISSION PEMAIN */}
            <div className="pt-4 border-t border-white/10">
              <span className="text-xs uppercase tracking-wider text-textMuted font-medium block mb-3">
                Status Jawaban Pemain
              </span>
              <div className="flex flex-wrap justify-center gap-2">
                {players.map((p) => {
                  const pSubmitted = gameState.submissions[p.player_id] !== undefined;
                  return (
                    <span
                      key={p.player_id}
                      className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border ${
                        pSubmitted
                          ? "bg-green-500/20 border-green-500/40 text-green-300"
                          : "bg-white/5 border-white/10 text-textMuted"
                      }`}
                    >
                      {pSubmitted ? <Lock className="w-3 h-3 text-green-400" /> : <Loader2 className="w-3 h-3 animate-spin" />}
                      {p.profiles?.username}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* PHASE 2: REVEAL */}
        {gameState.phase === "reveal" && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
            <div className="p-3 bg-secondary/20 border border-secondary/40 rounded-xl text-secondary text-sm font-bold inline-flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Jawaban Terbuka! (+15 Poin untuk jawaban sefrekuensi)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
              {players.map((p) => {
                const ans = gameState.submissions[p.player_id];
                // Cek apakah jawaban ini dipilih lebih dari 1 orang
                const isMatching = Object.values(gameState.submissions).filter((a) => a === ans).length >= 2;

                return (
                  <div
                    key={p.player_id}
                    className={`p-4 rounded-xl border text-left flex flex-col justify-between ${
                      isMatching
                        ? "bg-gradient-to-br from-secondary/20 to-primary/20 border-secondary shadow-[0_0_20px_rgba(6,182,212,0.2)]"
                        : "bg-white/5 border-white/10"
                    }`}
                  >
                    <span className="text-xs text-textMuted font-semibold">{p.profiles?.username}</span>
                    <span className="text-lg font-bold text-white mt-1">"{ans}"</span>
                    {isMatching && (
                      <span className="text-xs text-secondary font-bold mt-2">🔥 Match! (+15 pts)</span>
                    )}
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