"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { DoodleGuessState, submitDoodleGuess, nextDoodleRound } from "./actions";
import { Palette, Eraser, Award, ArrowRight, Loader2, Check, Send } from "lucide-react";
import { sounds } from "@/lib/audio";

interface Props {
  roomId: string;
  currentUserId: string;
  hostId: string;
  gameState: DoodleGuessState;
  players: { player_id: string; profiles: { username: string } }[];
}

export default function DoodleGuessGame({ roomId, currentUserId, hostId, gameState, players }: Props) {
  const supabase = createClient();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);

  const [guessInput, setGuessInput] = useState("");
  const [loading, setLoading] = useState(false);
  const isHost = currentUserId === hostId;
  const isDrawer = currentUserId === gameState.drawerId;
  const hasSolved = gameState.solvedPlayers.includes(currentUserId);

  const drawerName = players.find((p) => p.player_id === gameState.drawerId)?.profiles?.username || "Penggambar";

  // LISTEN BROADCAST KANVAS REALTIME
  useEffect(() => {
    if (!roomId) return;

    const channel = supabase.channel(`room_doodle_${roomId}`, {
      config: { broadcast: { ack: false } },
    });

    channel
      .on("broadcast", { event: "draw" }, (payload) => {
        if (isDrawer) return; // Penggambar tidak perlu menggambar ulang dari broadcast dirinya sendiri
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const { x0, y0, x1, y1, color } = payload.payload;
        ctx.strokeStyle = color || "#8b5cf6";
        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x0 * canvas.width, y0 * canvas.height);
        ctx.lineTo(x1 * canvas.width, y1 * canvas.height);
        ctx.stroke();
      })
      .on("broadcast", { event: "clear" }, () => {
        clearCanvasLocal();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, isDrawer]);

  const clearCanvasLocal = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleClearCanvas = async () => {
    sounds.playClick();
    clearCanvasLocal();
    const channel = supabase.channel(`room_doodle_${roomId}`);
    await channel.send({ type: "broadcast", event: "clear", payload: {} });
  };

  // HANDLER AKSI MOUSE/TOUCH PENGGAMBAR
  const drawLine = (x0: number, y0: number, x1: number, y1: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = "#8b5cf6";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();

    // Broadcast koordinat relatif (0.0 - 1.0) ke pemain lain
    const channel = supabase.channel(`room_doodle_${roomId}`);
    channel.send({
      type: "broadcast",
      event: "draw",
      payload: {
        x0: x0 / canvas.width,
        y0: y0 / canvas.height,
        x1: x1 / canvas.width,
        y1: y1 / canvas.height,
        color: "#8b5cf6",
      },
    });
  };

  const startDraw = (e: any) => {
    if (!isDrawer || gameState.phase !== "drawing") return;
    isDrawingRef.current = true;
  };

  const drawMove = (e: any) => {
    if (!isDrawer || !isDrawingRef.current || gameState.phase !== "drawing") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const currentX = clientX - rect.left;
    const currentY = clientY - rect.top;

    drawLine(currentX, currentY, currentX, currentY);
  };

  const stopDraw = () => {
    isDrawingRef.current = false;
  };

  const handleGuessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guessInput.trim() || hasSolved || isDrawer) return;
    sounds.playClick();
    setLoading(true);

    try {
      await submitDoodleGuess(roomId, currentUserId, guessInput, gameState);
      setGuessInput("");
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
      await nextDoodleRound(roomId, gameState);
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
          <Palette className="w-6 h-6 text-accent" />
          <span className="font-bold text-lg">Tebak Gambar Realtime</span>
        </div>
        <span className="text-xs bg-white/10 px-3 py-1 rounded-full text-textMuted font-medium">
          Ronde {gameState.round} / {gameState.maxRounds}
        </span>
      </div>

      {/* RAHASIA / PETUNJUK */}
      <div className="glass-panel p-4 text-center space-y-1">
        {isDrawer ? (
          <div>
            <span className="text-[10px] text-textMuted uppercase font-bold tracking-wider">Kamu Penggambar! Gambar Kata Ini:</span>
            <h2 className="text-2xl font-black text-secondary mt-0.5">{gameState.secretWord}</h2>
          </div>
        ) : (
          <div>
            <span className="text-[10px] text-textMuted uppercase font-bold tracking-wider">Sedang Menggambar:</span>
            <h2 className="text-lg font-bold text-white mt-0.5">{drawerName}</h2>
          </div>
        )}
      </div>

      {/* KANVAS MENGGAMBAR REALTIME */}
      <div className="glass-panel p-4 flex flex-col items-center space-y-3">
        <div className="relative border-2 border-white/20 rounded-2xl overflow-hidden bg-black/50 shadow-2xl touch-none">
          <canvas
            ref={canvasRef}
            width={340}
            height={260}
            onMouseDown={startDraw}
            onMouseMove={drawMove}
            onMouseUp={stopDraw}
            onTouchStart={startDraw}
            onTouchMove={drawMove}
            onTouchEnd={stopDraw}
            className={`cursor-crosshair ${!isDrawer && "pointer-events-none"}`}
          />
        </div>

        {isDrawer && (
          <button
            onClick={handleClearCanvas}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <Eraser className="w-4 h-4" /> Hapus Papan
          </button>
        )}
      </div>

      {/* INPUT TEBAKAN (PENEBAK) */}
      {!isDrawer && (
        <div className="glass-panel p-4 space-y-3">
          {hasSolved ? (
            <div className="p-3 bg-green-500/20 border border-green-500/30 text-green-300 rounded-xl text-center text-xs font-bold">
              ✓ Tebakanmu Benar! Menunggu pemain lain...
            </div>
          ) : (
            <form onSubmit={handleGuessSubmit} className="flex gap-2">
              <input
                type="text"
                required
                value={guessInput}
                onChange={(e) => setGuessInput(e.target.value)}
                placeholder="Ketik tebakan gambarmu di sini..."
                className="input-neon text-xs flex-1"
              />
              <button type="submit" disabled={loading} className="btn-primary py-2 px-4 text-xs flex items-center gap-1">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-3.5 h-3.5" /> Tebak</>}
              </button>
            </form>
          )}
        </div>
      )}

      {/* AKSI HOST KETIKA PHASE REVEAL */}
      {gameState.phase === "reveal" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6 text-center space-y-3">
          <h3 className="text-lg font-bold text-white">Ronde Selesai!</h3>
          <p className="text-xs text-textMuted">Jawaban aslinya adalah: <strong className="text-secondary">{gameState.secretWord}</strong></p>

          {isHost ? (
            <button disabled={loading} onClick={handleNextRound} className="btn-primary py-3 px-6 text-xs mx-auto flex items-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Lanjut Ronde Berikutnya <ArrowRight className="w-4 h-4" /></>}
            </button>
          ) : (
            <p className="text-xs text-textMuted italic">Menunggu Host melanjutkan ronde...</p>
          )}
        </motion.div>
      )}

      {/* SKOR SEMENTARA */}
      <div className="glass-panel p-4">
        <h3 className="text-xs font-bold text-textMuted mb-3 flex items-center gap-2">
          <Award className="w-4 h-4 text-yellow-400" /> Papan Skor
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {players.map((p) => (
            <div key={p.player_id} className="bg-white/5 border border-white/10 p-3 rounded-xl flex justify-between items-center text-xs">
              <span className="font-semibold truncate">{p.profiles?.username}</span>
              <span className="font-bold text-secondary">{gameState.scores[p.player_id] || 0} pts</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}