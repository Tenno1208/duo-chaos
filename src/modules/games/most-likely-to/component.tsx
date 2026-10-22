"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MostLikelyToState, submitVote, nextMostLikelyToRound } from "./actions";
import { Users, Vote, Award, ArrowRight, Loader2, Check, Sparkles } from "lucide-react";
import { sounds } from "@/lib/audio";

interface Props {
  roomId: string;
  currentUserId: string;
  hostId: string;
  gameState: MostLikelyToState;
  players: { player_id: string; profiles: { username: string } }[];
}

export default function MostLikelyToGame({ roomId, currentUserId, hostId, gameState, players }: Props) {
  const [loading, setLoading] = useState(false);
  const isHost = currentUserId === hostId;

  const myVote = gameState.votes[currentUserId];
  const hasVoted = myVote !== undefined;

  const handleVote = async (targetId: string) => {
    if (hasVoted || loading || gameState.phase !== "voting") return;
    sounds.playClick();
    setLoading(true);

    try {
      await submitVote(roomId, currentUserId, targetId, gameState);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNextRound = async () => {
    sounds.playClick();
    setLoading(true);
    try {
      await nextMostLikelyToRound(roomId, gameState);
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
          <Vote className="w-6 h-6 text-pink-400" />
          <span className="font-bold text-lg">Most Likely To</span>
        </div>
        <span className="text-xs bg-white/10 px-3 py-1 rounded-full text-textMuted font-medium">
          Round {gameState.round} / {gameState.maxRounds}
        </span>
      </div>

      {/* QUESTION ARENA */}
      <div className="glass-panel p-6 md:p-8 space-y-6 text-center">
        <h2 className="text-xl md:text-2xl font-extrabold text-white leading-snug">
          "{gameState.currentQuestion?.content}"
        </h2>

        {/* PHASE 1: VOTING */}
        {gameState.phase === "voting" && (
          <div className="space-y-4">
            <span className="text-xs text-textMuted uppercase font-bold tracking-wider block">
              Pilih salah satu pemain yang paling cocok:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
              {players.map((p) => {
                const isSelected = myVote === p.player_id;

                return (
                  <button
                    key={p.player_id}
                    disabled={hasVoted || loading}
                    onClick={() => handleVote(p.player_id)}
                    className={`p-4 rounded-xl border font-bold text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? "bg-pink-500/20 border-pink-400 text-white shadow-[0_0_15px_rgba(236,72,153,0.3)]"
                        : "bg-white/5 border-white/10 hover:bg-white/10 text-textMuted hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-xs text-white">
                        {p.profiles?.username?.[0]?.toUpperCase() || "P"}
                      </div>
                      <span>{p.profiles?.username}</span>
                    </div>
                    {isSelected && <Check className="w-5 h-5 text-pink-400" />}
                  </button>
                );
              })}
            </div>

            <div className="pt-4 border-t border-white/10">
              <span className="text-xs text-textMuted uppercase font-semibold block mb-2">Status Vote</span>
              <div className="flex justify-center gap-2">
                {players.map((p) => {
                  const pVoted = gameState.votes[p.player_id] !== undefined;
                  return (
                    <span
                      key={p.player_id}
                      className={`text-xs px-3 py-1 rounded-lg border font-medium ${
                        pVoted ? "bg-green-500/20 border-green-500/40 text-green-300" : "bg-white/5 border-white/10 text-textMuted"
                      }`}
                    >
                      {p.profiles?.username} {pVoted ? "✓" : "..."}
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
            <div className="p-3 bg-pink-500/20 border border-pink-500/40 rounded-xl text-pink-300 text-sm font-bold inline-flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Hasil Vote Terbuka!
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto text-left">
              {players.map((p) => {
                const votedTargetId = gameState.votes[p.player_id];
                const targetName = players.find((t) => t.player_id === votedTargetId)?.profiles?.username || "-";

                return (
                  <div key={p.player_id} className="p-4 bg-white/5 border border-white/10 rounded-xl">
                    <span className="text-xs text-textMuted font-semibold block">{p.profiles?.username} memilih:</span>
                    <span className="text-lg font-bold text-white mt-1 block">👉 {targetName}</span>
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