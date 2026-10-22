"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { TruthOrDareState, selectTruthOrDareChoice, completeTurn } from "./actions";
import { Swords, CheckCircle2, XCircle, Award, Loader2 } from "lucide-react";

interface Props {
  roomId: string;
  currentUserId: string;
  gameState: TruthOrDareState;
  players: { player_id: string; profiles: { username: string } }[];
}

export default function TruthOrDareGame({ roomId, currentUserId, gameState, players }: Props) {
  const [loading, setLoading] = useState(false);

  const isActivePlayer = currentUserId === gameState.activePlayerId;
  const activePlayerName = players.find((p) => p.player_id === gameState.activePlayerId)?.profiles?.username || "Pemain";

  const handleChoice = async (choice: "truth" | "dare") => {
    setLoading(true);
    try {
      await selectTruthOrDareChoice(roomId, choice, gameState);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (skipped: boolean) => {
    setLoading(true);
    try {
      await completeTurn(roomId, gameState, skipped);
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
          <Swords className="w-6 h-6 text-accent" />
          <span className="font-bold text-lg">Truth or Dare</span>
        </div>
        <span className="text-xs bg-white/10 px-3 py-1 rounded-full text-textMuted font-medium">
          Round {gameState.round} / {gameState.maxRounds}
        </span>
      </div>

      {/* GAME ARENA CARD */}
      <div className="glass-panel p-8 text-center space-y-6 relative overflow-hidden">
        {/* PLAYER TURN BAR */}
        <div className="inline-block px-4 py-2 bg-primary/20 border border-primary/40 rounded-xl text-sm font-semibold">
          {isActivePlayer ? (
            <span className="text-secondary animate-pulse">🔥 Giliran Kamu!</span>
          ) : (
            <span className="text-textMuted">Giliran: <strong className="text-white">{activePlayerName}</strong></span>
          )}
        </div>

        {/* PHASE 1: CHOOSING (TRUTH OR DARE) */}
        {gameState.phase === "choosing" && (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-6">
            <h2 className="text-2xl font-bold">
              {isActivePlayer ? "Pilih Tantanganmu!" : `Menunggu ${activePlayerName} memilih...`}
            </h2>

            {isActivePlayer ? (
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                <button
                  disabled={loading}
                  onClick={() => handleChoice("truth")}
                  className="p-6 bg-secondary/20 hover:bg-secondary/30 border-2 border-secondary text-secondary rounded-2xl font-bold text-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.2)]"
                >
                  TRUTH
                </button>
                <button
                  disabled={loading}
                  onClick={() => handleChoice("dare")}
                  className="p-6 bg-accent/20 hover:bg-accent/30 border-2 border-accent text-accent rounded-2xl font-bold text-xl transition-all shadow-[0_0_20px_rgba(236,72,153,0.2)]"
                >
                  DARE
                </button>
              </div>
            ) : (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            )}
          </motion.div>
        )}

        {/* PHASE 2: ANSWERING */}
        {gameState.phase === "answering" && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="space-y-6">
            <span className={`inline-block px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              gameState.currentChoice === "truth" ? "bg-secondary/20 text-secondary border border-secondary/40" : "bg-accent/20 text-accent border border-accent/40"
            }`}>
              {gameState.currentChoice}
            </span>

            <p className="text-xl md:text-2xl font-extrabold leading-relaxed text-white max-w-xl mx-auto">
              "{gameState.currentPrompt}"
            </p>

            {isActivePlayer ? (
              <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto pt-4">
                <button
                  disabled={loading}
                  onClick={() => handleAction(false)}
                  className="btn-primary flex-1 py-3 text-base"
                >
                  <CheckCircle2 className="w-5 h-5" /> Selesai (+10 Poin)
                </button>
                <button
                  disabled={loading}
                  onClick={() => handleAction(true)}
                  className="btn-secondary flex-1 py-3 text-base text-red-400 border-red-500 hover:bg-red-500/10"
                >
                  <XCircle className="w-5 h-5" /> Lewati (0 Poin)
                </button>
              </div>
            ) : (
              <p className="text-sm text-textMuted italic pt-4">
                Perhatikan {activePlayerName} menyelesaikan {gameState.currentChoice}-nya!
              </p>
            )}
          </motion.div>
        )}
      </div>

      {/* SCOREBOARD BOARD */}
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