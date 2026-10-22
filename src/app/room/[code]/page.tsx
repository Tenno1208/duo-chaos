"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { Copy, Check, Crown, LogOut, Play, ShieldAlert, Loader2, Swords, BrainCircuit, Zap, Vote, RotateCcw, Home } from "lucide-react";

import { startTruthOrDare, TruthOrDareState } from "@/modules/games/truth-or-dare/actions";
import { startMindReader, MindReaderState } from "@/modules/games/mind-reader/actions";
import { startSpeedBattle, SpeedBattleState } from "@/modules/games/speed-battle/actions";
import { startMostLikelyTo, MostLikelyToState } from "@/modules/games/most-likely-to/actions";

import TruthOrDareGame from "@/modules/games/truth-or-dare/component";
import MindReaderGame from "@/modules/games/mind-reader/component";
import SpeedBattleGame from "@/modules/games/speed-battle/component";
import MostLikelyToGame from "@/modules/games/most-likely-to/component";

import EmoteOverlay from "@/components/ui/EmoteOverlay";
import { sounds } from "@/lib/audio";

interface Player {
  player_id: string;
  is_ready: boolean;
  profiles: {
    username: string;
  };
}

export default function RoomLobby({ params }: { params: { code: string } }) {
  const roomCode = params.code;
  const router = useRouter();
  const supabase = createClient();

  const [roomId, setRoomId] = useState<string | null>(null);
  const [hostId, setHostId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [maxPlayers, setMaxPlayers] = useState<number>(4);
  const [status, setStatus] = useState<"waiting" | "playing" | "finished">("waiting");
  const [currentGameId, setCurrentGameId] = useState<string | null>("truth-or-dare");
  const [gameState, setGameState] = useState<any>({});

  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [startingGame, setStartingGame] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function initRoom() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/");
        return;
      }
      setCurrentUserId(session.user.id);

      const { data: room, error: roomErr } = await supabase
        .from("rooms")
        .select("id, host_id, max_players, status, current_game_id, game_state")
        .eq("code", roomCode)
        .single();

      if (roomErr || !room) {
        setError("Room tidak ditemukan.");
        setLoading(false);
        return;
      }

      setRoomId(room.id);
      setHostId(room.host_id);
      setMaxPlayers(room.max_players);
      setStatus(room.status);
      if (room.current_game_id) setCurrentGameId(room.current_game_id);
      setGameState(room.game_state || {});

      fetchPlayers(room.id);
      setLoading(false);
    }

    initRoom();
  }, [roomCode]);

  async function fetchPlayers(rId: string) {
    const { data } = await supabase
      .from("room_players")
      .select("player_id, is_ready, profiles(username)")
      .eq("room_id", rId);

    if (data) {
      setPlayers(data as unknown as Player[]);
    }
  }

  useEffect(() => {
    if (!roomId) return;

    const playerChannel = supabase
      .channel(`room_players_${roomId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "room_players", filter: `room_id=eq.${roomId}` },
        () => fetchPlayers(roomId)
      )
      .subscribe();

    const roomChannel = supabase
      .channel(`room_state_${roomId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${roomId}` },
        (payload) => {
          setStatus(payload.new.status);
          setCurrentGameId(payload.new.current_game_id);
          setGameState(payload.new.game_state);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(playerChannel);
      supabase.removeChannel(roomChannel);
    };
  }, [roomId]);

  useEffect(() => {
    async function updatePlayerStats() {
      if (status === "finished" && currentUserId && gameState.scores) {
        sounds.playVictory();

        const myScore = gameState.scores[currentUserId] || 0;
        const allScores = Object.values(gameState.scores) as number[];
        const maxScore = Math.max(...allScores, 0);
        const isWinner = myScore === maxScore && myScore > 0;

        const { data: profile } = await supabase
          .from("profiles")
          .select("xp, total_matches, wins")
          .eq("id", currentUserId)
          .single();

        if (profile) {
          await supabase
            .from("profiles")
            .update({
              xp: (profile.xp || 0) + myScore + (isWinner ? 50 : 10),
              total_matches: (profile.total_matches || 0) + 1,
              wins: (profile.wins || 0) + (isWinner ? 1 : 0),
            })
            .eq("id", currentUserId);
        }
      }
    }

    updatePlayerStats();
  }, [status]);

  const copyCode = () => {
    sounds.playClick();
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleReady = async () => {
    sounds.playClick();
    if (!roomId || !currentUserId) return;
    const currentPlayer = players.find((p) => p.player_id === currentUserId);
    if (!currentPlayer) return;

    await supabase
      .from("room_players")
      .update({ is_ready: !currentPlayer.is_ready })
      .eq("room_id", roomId)
      .eq("player_id", currentUserId);
  };

  const leaveRoom = async () => {
    sounds.playClick();
    if (!roomId || !currentUserId) return;
    await supabase.from("room_players").delete().eq("room_id", roomId).eq("player_id", currentUserId);
    router.push("/");
  };

  const handleStartGame = async () => {
    sounds.playClick();
    if (!roomId || !currentGameId) return;
    setStartingGame(true);
    try {
      if (currentGameId === "truth-or-dare") {
        await startTruthOrDare(roomId, players);
      } else if (currentGameId === "mind-reader") {
        await startMindReader(roomId, players);
      } else if (currentGameId === "speed-battle") {
        await startSpeedBattle(roomId, players);
      } else if (currentGameId === "most-likely-to") {
        await startMostLikelyTo(roomId, players);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setStartingGame(false);
    }
  };

  const handleBackToLobby = async () => {
    sounds.playClick();
    if (!roomId) return;
    setStartingGame(true);
    try {
      await supabase
        .from("room_players")
        .update({ is_ready: false })
        .eq("room_id", roomId);

      await supabase
        .from("rooms")
        .update({
          status: "waiting",
          game_state: {},
        })
        .eq("id", roomId);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setStartingGame(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-textMuted">Entering Lobby...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-4 text-center">
        <ShieldAlert className="w-16 h-16 text-red-500" />
        <h2 className="text-2xl font-bold">{error}</h2>
        <button onClick={() => router.push("/")} className="btn-primary">Back to Home</button>
      </div>
    );
  }

  const isHost = currentUserId === hostId;
  const myPlayerState = players.find((p) => p.player_id === currentUserId);
  const allReady = players.length >= 2 && players.every((p) => p.is_ready);
  const currentUsername = players.find((p) => p.player_id === currentUserId)?.profiles?.username || "Pemain";

  let mainContent;

  if (status === "playing" && currentGameId === "truth-or-dare" && roomId && currentUserId) {
    mainContent = (
      <TruthOrDareGame roomId={roomId} currentUserId={currentUserId} gameState={gameState as TruthOrDareState} players={players} />
    );
  } else if (status === "playing" && currentGameId === "mind-reader" && roomId && currentUserId && hostId) {
    mainContent = (
      <MindReaderGame roomId={roomId} currentUserId={currentUserId} hostId={hostId} gameState={gameState as MindReaderState} players={players} />
    );
  } else if (status === "playing" && currentGameId === "speed-battle" && roomId && currentUserId && hostId) {
    mainContent = (
      <SpeedBattleGame roomId={roomId} currentUserId={currentUserId} hostId={hostId} gameState={gameState as SpeedBattleState} players={players} />
    );
  } else if (status === "playing" && currentGameId === "most-likely-to" && roomId && currentUserId && hostId) {
    mainContent = (
      <MostLikelyToGame roomId={roomId} currentUserId={currentUserId} hostId={hostId} gameState={gameState as MostLikelyToState} players={players} />
    );
  } else if (status === "finished") {
    const scores: Record<string, number> = gameState.scores || {};
    const sortedPlayers = [...players].sort((a, b) => (scores[b.player_id] || 0) - (scores[a.player_id] || 0));

    mainContent = (
      <div className="max-w-md mx-auto glass-panel p-8 text-center space-y-6">
        <div className="p-4 bg-yellow-500/20 text-yellow-400 rounded-full w-20 h-20 mx-auto flex items-center justify-center shadow-[0_0_30px_rgba(234,179,8,0.3)]">
          <Crown className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-black">Pertandingan Selesai!</h1>
        
        <div className="space-y-3 text-left">
          {sortedPlayers.map((p, idx) => (
            <div key={p.player_id} className={`p-4 rounded-xl border flex items-center justify-between ${idx === 0 ? "bg-primary/20 border-primary" : "bg-white/5 border-white/10"}`}>
              <div className="flex items-center gap-3">
                <span className="font-bold text-lg">#{idx + 1}</span>
                <span className="font-semibold">{p.profiles?.username}</span>
              </div>
              <span className="font-bold text-secondary">{scores[p.player_id] || 0} pts</span>
            </div>
          ))}
        </div>

        <div className="space-y-3 pt-2">
          {isHost ? (
            <>
              <button disabled={startingGame} onClick={handleStartGame} className="w-full btn-primary py-3.5 flex items-center justify-center gap-2">
                {startingGame ? <Loader2 className="w-5 h-5 animate-spin" /> : <><RotateCcw className="w-5 h-5" /> Main Lagi (Rematch)</>}
              </button>
              
              <button disabled={startingGame} onClick={handleBackToLobby} className="w-full btn-secondary py-3.5 flex items-center justify-center gap-2">
                <Home className="w-5 h-5" /> Kembali ke Lobby
              </button>
            </>
          ) : (
            <p className="text-sm text-textMuted italic animate-pulse">
              Menunggu Host memilih rematch atau kembali ke lobby...
            </p>
          )}

          <button onClick={leaveRoom} className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-bold transition-all">
            Keluar Room
          </button>
        </div>
      </div>
    );
  } else {
    mainContent = (
      <div className="max-w-2xl mx-auto space-y-8 py-6">
        {/* ROOM HEADER DENGAN TOMBOL SHARE WA */}
        <div className="glass-panel p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-xs uppercase tracking-widest text-textMuted">Room Code</span>
            <div className="flex items-center gap-3 mt-1">
              <h1 className="text-4xl font-extrabold tracking-widest text-secondary">{roomCode}</h1>
              <button onClick={copyCode} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-textMuted hover:text-white" title="Salin Kode">
                {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
              </button>

              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  `Ayo tanding party game bareng aku di DUO CHAOS! 🎮🔥\nMasuk ke room pake kode: *${roomCode}* atau langsung klik link berikut:\n${typeof window !== "undefined" ? window.location.href : ""}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-all text-xs font-bold flex items-center gap-1"
                title="Share ke WhatsApp"
              >
                <span>WA</span>
              </a>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
              Pemain: <strong className="text-white">{players.length}</strong> / {maxPlayers}
            </span>
            <button onClick={leaveRoom} className="p-3 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-xl transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-bold text-textMuted px-1">Lobby Members</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {players.map((p) => {
              const isPlayerHost = p.player_id === hostId;
              const isMe = p.player_id === currentUserId;

              return (
                <motion.div
                  key={p.player_id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`glass-panel p-4 flex items-center justify-between border ${isMe ? "border-primary/50 bg-primary/10" : "border-white/10"}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center font-bold text-white shadow-md">
                      {p.profiles?.username?.[0]?.toUpperCase() || "P"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{p.profiles?.username}</span>
                        {isMe && <span className="text-xs text-primary font-medium">(You)</span>}
                      </div>
                      {isPlayerHost && (
                        <span className="inline-flex items-center gap-1 text-xs text-yellow-400 font-medium">
                          <Crown className="w-3 h-3" /> Host
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    {p.is_ready ? (
                      <span className="px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg text-xs font-bold uppercase tracking-wider">Ready</span>
                    ) : (
                      <span className="px-3 py-1 bg-white/5 text-textMuted border border-white/10 rounded-lg text-xs font-bold uppercase tracking-wider">Waiting</span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {isHost && (
          <div className="space-y-3">
            <label className="text-sm text-textMuted font-bold">Pilih Mini-Game</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                onClick={() => { sounds.playClick(); setCurrentGameId("truth-or-dare"); }}
                className={`p-3 rounded-xl border flex flex-col items-center text-center gap-2 transition-all ${
                  currentGameId === "truth-or-dare" ? "bg-primary/20 border-primary text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]" : "bg-white/5 border-white/10 text-textMuted hover:bg-white/10"
                }`}
              >
                <Swords className="w-5 h-5 text-accent" />
                <div className="font-bold text-xs">Truth or Dare</div>
              </button>

              <button
                onClick={() => { sounds.playClick(); setCurrentGameId("mind-reader"); }}
                className={`p-3 rounded-xl border flex flex-col items-center text-center gap-2 transition-all ${
                  currentGameId === "mind-reader" ? "bg-secondary/20 border-secondary text-white shadow-[0_0_15px_rgba(6,182,212,0.3)]" : "bg-white/5 border-white/10 text-textMuted hover:bg-white/10"
                }`}
              >
                <BrainCircuit className="w-5 h-5 text-secondary" />
                <div className="font-bold text-xs">Mind Reader</div>
              </button>

              <button
                onClick={() => { sounds.playClick(); setCurrentGameId("speed-battle"); }}
                className={`p-3 rounded-xl border flex flex-col items-center text-center gap-2 transition-all ${
                  currentGameId === "speed-battle" ? "bg-yellow-500/20 border-yellow-400 text-white shadow-[0_0_15px_rgba(234,179,8,0.3)]" : "bg-white/5 border-white/10 text-textMuted hover:bg-white/10"
                }`}
              >
                <Zap className="w-5 h-5 text-yellow-400" />
                <div className="font-bold text-xs">Speed Battle</div>
              </button>

              <button
                onClick={() => { sounds.playClick(); setCurrentGameId("most-likely-to"); }}
                className={`p-3 rounded-xl border flex flex-col items-center text-center gap-2 transition-all ${
                  currentGameId === "most-likely-to" ? "bg-pink-500/20 border-pink-400 text-white shadow-[0_0_15px_rgba(236,72,153,0.3)]" : "bg-white/5 border-white/10 text-textMuted hover:bg-white/10"
                }`}
              >
                <Vote className="w-5 h-5 text-pink-400" />
                <div className="font-bold text-xs">Most Likely To</div>
              </button>
            </div>
          </div>
        )}

        <div className="glass-panel p-6 space-y-4">
          {!isHost && (
            <button onClick={toggleReady} className={`w-full py-4 text-lg rounded-xl font-bold transition-all ${myPlayerState?.is_ready ? "bg-red-500/20 border-2 border-red-500 text-red-400 hover:bg-red-500/30" : "btn-primary"}`}>
              {myPlayerState?.is_ready ? "Cancel Ready" : "I'm Ready!"}
            </button>
          )}

          {isHost && (
            <div className="space-y-3">
              <button disabled={!allReady || startingGame} onClick={handleStartGame} className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-2">
                {startingGame ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Play className="w-5 h-5 fill-current" /> Start Game</>}
              </button>
              {!allReady && (
                <p className="text-xs text-center text-textMuted">*Membutuhkan minimal 2 pemain dan semua pemain harus dalam status <strong>Ready</strong> untuk memulai.</p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      {mainContent}
      {roomId && currentUserId && <EmoteOverlay roomId={roomId} username={currentUsername} />}
    </>
  );
}