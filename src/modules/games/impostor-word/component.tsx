"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ImpostorWordState, submitClue, submitImpostorVote, nextImpostorRound } from "./actions";
import { ShieldAlert, Eye, Vote, Award, ArrowRight, Loader2, Check, Sparkles, UserX } from "lucide-react";
import { sounds } from "@/lib/audio";

interface Props {
  roomId: string;
  currentUserId: string;
  hostId: string;
  gameState: ImpostorWordState;
  players: { player_id: string; profiles: { username: string } }[];
}

export default function ImpostorWordGame({ roomId, currentUserId, hostId, gameState, players }: Props) {
  const [clueInput, setClueInput] = useState("");
  const [loading, setLoading] = useState(false);
  const isHost = currentUserId === hostId;

  const isImpostor = currentUserId === gameState.impostorId;
  const myClue = gameState.clues[currentUserId];
  const hasClued = myClue !== undefined;
  const myVote = gameState.votes[currentUserId];
  const hasVoted = myVote !== undefined;

  const wordToDisplay = isImpostor ? gameState.impostorWord : gameState.secretWord;

  const handleClueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clueInput.trim() || hasClued || loading) return;
    sounds.playClick();
    setLoading(true);

    try {
      await submitClue(roomId, currentUserId, clueInput.trim(), gameState);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVoteSubmit = async (targetId: string) => {
    if (hasVoted || loading) return;
    sounds.playClick();
    setLoading(true);

    try {
      await submitImpostorVote(roomId, currentUserId, targetId, gameState);
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
      await nextImpostorRound(roomId, gameState);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* HEADER BAR */}
      <div className="glass-panel p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserX className="w-6 h-6 text-red-400" />
          <span className="font-bold text-lg">Detektif Halusinasi</span>
        </div>
        <span className="text-xs bg-white/10 px-3 py-1 rounded-full text-textMuted font-medium">
          Ronde {gameState.round} / {gameState.maxRounds}
        </span>
      </div>

      {/* RAHASIA KATA */}
      <div className="glass-panel p-6 text-center space-y-3 relative overflow-hidden">
        <span className="text-xs text-textMuted uppercase font-bold tracking-wider block">Kata Rahasia Kamu</span>
        
        <div className={`p-4 rounded-2xl border text-2xl font-black tracking-widest inline-block ${
          isImpostor 
            ? "bg-red-500/20 border-red-500/50 text-red-300 shadow-[0_0_20px_rgba(239,68,68,0.3)]" 
            : "bg-primary/20 border-primary/50 text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]"
        }`}>
          {wordToDisplay}
        </div>

        {isImpostor && (
          <p className="text-xs text-red-400 font-semibold flex items-center justify-center gap-1">
            <ShieldAlert className="w-4 h-4" /> Kamu adalah Impostor! Samarkan petunjukmu agar tidak dicurigai!
          </p>
        )}
      </div>

      {/* ARENA GAME PER PHASE */}
      <div className="glass-panel p-6 md:p-8 space-y-6">
        
        {/* PHASE 1: SUBMIT PETUNJUK */}
        {gameState.phase === "clue" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-textMuted text-center">
              Tulis 1 kata petunjuk yang menggambarkan kata rahasiamu:
            </h3>

            {!hasClued ? (
              <form onSubmit={handleClueSubmit} className="flex gap-2 max-w-md mx-auto">
                <input
                  type="text"
                  required
                  maxLength={20}
                  value={clueInput}
                  onChange={(e) => setClueInput(e.target.value)}
                  placeholder="Contoh: Bulu / Manja..."
                  className="input-neon text-sm flex-1"
                />
                <button type="submit" disabled={loading} className="btn-primary py-2 px-5 text-sm">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Kirim"}
                </button>
              </form>
            ) : (
              <div className="text-center p-3 bg-green-500/20 border border-green-500/30 text-green-300 rounded-xl text-xs font-bold">
                ✓ Petunjuk dikirim! Menunggu pemain lain...
              </div>
            )}

            {/* STATUS PETUNJUK PEMAIN */}
            <div className="pt-4 border-t border-white/10 grid grid-cols-2 gap-2">
              {players.map((p) => {
                const pClued = gameState.clues[p.player_id] !== undefined;
                return (
                  <div key={p.player_id} className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs flex justify-between items-center">
                    <span className="font-semibold">{p.profiles?.username}</span>
                    <span className={pClued ? "text-green-400 font-bold" : "text-textMuted"}>
                      {pClued ? "✓ Siap" : "Mengetik..."}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PHASE 2: VOTING IMPOSTOR */}
        {gameState.phase === "voting" && (
          <div className="space-y-5">
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-white">Analisis Petunjuk & Voting Impostor</h3>
              <p className="text-xs text-textMuted">Pilih pemain yang petunjuknya paling aneh atau mencurigakan!</p>
            </div>

            {/* DAFTAR PETUNJUK PEMAIN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {players.map((p) => {
                const clueText = gameState.clues[p.player_id] || "-";
                const isSelected = myVote === p.player_id;

                return (
                  <button
                    key={p.player_id}
                    disabled={hasVoted || loading}
                    onClick={() => handleVoteSubmit(p.player_id)}
                    className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? "bg-red-500/20 border-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                        : "bg-white/5 border-white/10 hover:bg-white/10 text-textMuted hover:text-white"
                    }`}
                  >
                    <div>
                      <span className="text-xs text-textMuted font-bold block">{p.profiles?.username}</span>
                      <span className="text-base font-extrabold text-white mt-0.5 block">"{clueText}"</span>
                    </div>
                    {isSelected && <Check className="w-5 h-5 text-red-400" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* PHASE 3: REVEAL */}
        {gameState.phase === "reveal" && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6 text-center">
            <div className="p-4 bg-red-500/20 border border-red-500/40 rounded-2xl text-red-300 space-y-1">
              <span className="text-xs uppercase font-bold tracking-wider block">Impostor Sebenarnya Adalah</span>
              <h2 className="text-2xl font-black text-white">
                {players.find((p) => p.player_id === gameState.impostorId)?.profiles?.username}
              </h2>
              <p className="text-xs text-textMuted mt-1">
                Kata asli warga: <strong className="text-white">{gameState.secretWord}</strong> | Kata impostor: <strong className="text-white">{gameState.impostorWord}</strong>
              </p>
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

      {/* SKOR SEMENTARA */}
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