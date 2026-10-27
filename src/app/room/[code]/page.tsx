"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { Copy, Check, Crown, LogOut, Play, ShieldAlert, Loader2, Swords, BrainCircuit, Zap, Vote, UserX, Palette, RotateCcw, Home, Sliders, Timer, Hash, Eye } from "lucide-react";

import { startTruthOrDare, TruthOrDareState } from "@/modules/games/truth-or-dare/actions";
import { startMindReader, MindReaderState } from "@/modules/games/mind-reader/actions";
import { startSpeedBattle, SpeedBattleState } from "@/modules/games/speed-battle/actions";
import { startMostLikelyTo, MostLikelyToState } from "@/modules/games/most-likely-to/actions";
import { startImpostorWord, ImpostorWordState } from "@/modules/games/impostor-word/actions";
import { startDoodleGuess, DoodleGuessState } from "@/modules/games/doodle-guess/actions";

import TruthOrDareGame from "@/modules/games/truth-or-dare/component";
import MindReaderGame from "@/modules/games/mind-reader/component";
import SpeedBattleGame from "@/modules/games/speed-battle/component";
import MostLikelyToGame from "@/modules/games/most-likely-to/component";
import ImpostorWordGame from "@/modules/games/impostor-word/component";
import DoodleGuessGame from "@/modules/games/doodle-guess/component";

import EmoteOverlay from "@/components/ui/EmoteOverlay";
import AvatarPicker from "@/components/ui/AvatarPicker";
import { sounds } from "@/lib/audio";

interface Player {
  player_id: string;
  is_ready: boolean;
  is_spectator: boolean;
  profiles: {
    username: string;
    avatar_url?: string;
  };
}

// VARIASI ANIMASI SCREEN SHAKE
const screenShakeVariant = {
  shake: {
    x: [0, -8, 8, -8, 8, -4, 4, 0],
    y: [0, 4, -4, 4, -4, 2, -2, 0],
    transition: { duration: 0.4, repeat: Infinity }
  }
};

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

  const [maxRounds, setMaxRounds] = useState<number>(3);
  const [roundTimer, setRoundTimer] = useState<number>(15);

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
        .select("id, host_id, max_players, status, current_game_id, game_state, max_rounds, round_timer")
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
      if (room.max_rounds) setMaxRounds(room.max_rounds);
      if (room.round_timer) setRoundTimer(room.round_timer);

      fetchPlayers(room.id);
      setLoading(false);
    }

    initRoom();
  }, [roomCode]);

  useEffect(() => {
    if (status === "waiting") {
      sounds.startBGM("lobby");
    } else if (status === "playing") {
      sounds.startBGM("game");
    } else if (status === "finished") {
      sounds.stopBGM();
    }
    return () => sounds.stopBGM();
  }, [status]);

  async function fetchPlayers(rId: string) {
    const { data } = await supabase
      .from("room_players")
      .select("player_id, is_ready, is_spectator, profiles(username, avatar_url)")
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
          if (payload.new.max_rounds) setMaxRounds(payload.new.max_rounds);
          if (payload.new.round_timer) setRoundTimer(payload.new.round_timer);
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

  const updateRoomRules = async (newRounds: number, newTimer: number) => {
    sounds.playClick();
    if (!roomId) return;
    setMaxRounds(newRounds);
    setRoundTimer(newTimer);

    await supabase
      .from("rooms")
      .update({ max_rounds: newRounds, round_timer: newTimer })
      .eq("id", roomId);
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

    const activePlayers = players.filter((p) => !p.is_spectator);

    try {
      if (currentGameId === "truth-or-dare") {
        await startTruthOrDare(roomId, activePlayers);
      } else if (currentGameId === "mind-reader") {
        await startMindReader(roomId, activePlayers);
      } else if (currentGameId === "speed-battle") {
        await startSpeedBattle(roomId, activePlayers);
      } else if (currentGameId === "most-likely-to") {
        await startMostLikelyTo(roomId, activePlayers);
      } else if (currentGameId === "impostor-word") {
        await startImpostorWord(roomId, activePlayers);
      } else if (currentGameId === "doodle-guess") {
        await startDoodleGuess(roomId, activePlayers);
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
  const activePlayers = players.filter((p) => !p.is_spectator);
  const spectatorPlayers = players.filter((p) => p.is_spectator);
  const allReady = activePlayers.length >= 2 && activePlayers.every((p) => p.is_ready);
  const currentUsername = myPlayerState?.profiles?.username || "Pemain";
  const myAvatar = myPlayerState?.profiles?.avatar_url || "🎮";

  let mainContent;

  if (status === "playing" && currentGameId === "truth-or-dare" && roomId && currentUserId) {
    mainContent = (
      <TruthOrDareGame roomId={roomId} currentUserId={currentUserId} gameState={gameState as TruthOrDareState} players={activePlayers} />
    );
  } else if (status === "playing" && currentGameId === "mind-reader" && roomId && currentUserId && hostId) {
    mainContent = (
      <MindReaderGame roomId={roomId} currentUserId={currentUserId} hostId={hostId} gameState={gameState as MindReaderState} players={activePlayers} />
    );
  } else if (status === "playing" && currentGameId === "speed-battle" && roomId && currentUserId && hostId) {
    mainContent = (
      <SpeedBattleGame roomId={roomId} currentUserId={currentUserId} hostId={hostId} gameState={gameState as SpeedBattleState} players={activePlayers} />
    );
  } else if (status === "playing" && currentGameId === "most-likely-to" && roomId && currentUserId && hostId) {
    mainContent = (
      <MostLikelyToGame roomId={roomId} currentUserId={currentUserId} hostId={hostId} gameState={gameState as MostLikelyToState} players={activePlayers} />
    );
  } else if (status === "playing" && currentGameId === "impostor-word" && roomId && currentUserId && hostId) {
    mainContent = (
      <ImpostorWordGame roomId={roomId} currentUserId={currentUserId} hostId={hostId} gameState={gameState as ImpostorWordState} players={activePlayers} />
    );
  } else if (status === "playing" && currentGameId === "doodle-guess" && roomId && currentUserId && hostId) {
    mainContent = (
      <DoodleGuessGame roomId={roomId} currentUserId={currentUserId} hostId={hostId} gameState={gameState as DoodleGuessState} players={activePlayers} />
    );
  } else if (status === "finished") {
    const scores: Record<string, number> = gameState.scores || {};
    const sortedPlayers = [...activePlayers].sort((a, b) => (scores[b.player_id] || 0) - (scores[a.player_id] || 0));

    const [votedRematch, setVotedRematch] = useState(false);

    const handleVoteRematch = async () => {
      sounds.playClick();
      setVotedRematch(true);
      if (!roomId) return;

      await supabase
        .from("room_players")
        .update({ is_ready: true })
        .eq("room_id", roomId)
        .eq("player_id", currentUserId);

      if (isHost) {
        await supabase
          .from("rooms")
          .update({
            status: "waiting",
            game_state: {},
          })
          .eq("id", roomId);
      }
    };

    mainContent = (
      <motion.div variants={screenShakeVariant} animate="shake" className="max-w-md mx-auto glass-panel p-8 text-center space-y-6">
        <div className="p-4 bg-yellow-500/20 text-yellow-400 rounded-full w-20 h-20 mx-auto flex items-center justify-center shadow-[0_0_30px_rgba(234,179,8,0.3)]">
          <Crown className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-black">Pertandingan Selesai!</h1>
        
        <div className="space-y-3 text-left">
          {sortedPlayers.map((p, idx) => (
            <div key={p.player_id} className={`p-4 rounded-xl border flex items-center justify-between ${idx === 0 ? "bg-primary/20 border-primary" : "bg-white/5 border-white/10"}`}>
              <div className="flex items-center gap-3">
                <span className="font-bold text-lg">#{idx + 1}</span>
                <span className="text-xl">{p.profiles?.avatar_url || "🎮"}</span>
                <span className="font-semibold">{p.profiles?.username}</span>
              </div>
              <span className="font-bold text-secondary">{scores[p.player_id] || 0} pts</span>
            </div>
          ))}
        </div>

        <div className="space-y-3 pt-2">
          {!votedRematch ? (
            <button onClick={handleVoteRematch} className="w-full btn-primary py-3.5 flex items-center justify-center gap-2">
              <RotateCcw className="w-5 h-5" /> Vote Rematch (Main Lagi)
            </button>
          ) : (
            <div className="p-3 bg-green-500/20 border border-green-500/30 text-green-300 rounded-xl text-xs font-bold animate-pulse">
              ✓ Kamu setuju Rematch! Menunggu pemain lain...
            </div>
          )}

          {isHost && (
            <button disabled={startingGame} onClick={handleBackToLobby} className="w-full btn-secondary py-3.5 flex items-center justify-center gap-2">
              <Home className="w-5 h-5" /> Kembali ke Lobby
            </button>
          )}

          <button onClick={leaveRoom} className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-bold transition-all">
            Keluar Room
          </button>
        </div>
      </motion.div>
    );
  } else {
    mainContent = (
      <div className="max-w-2xl mx-auto space-y-6 py-6">
        {/* ROOM HEADER */}
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
            {currentUserId && (
              <AvatarPicker
                userId={currentUserId}
                currentAvatar={myAvatar}
                onUpdate={() => roomId && fetchPlayers(roomId)}
              />
            )}

            <span className="text-sm bg-white/5 border border-white/10 px-3 py-2 rounded-xl">
              <strong className="text-white">{activePlayers.length}</strong>/{maxPlayers}
            </span>
            <button onClick={leaveRoom} className="p-2.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-xl transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* LOBBY MEMBERS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-textMuted px-1">Pemain Utama</h2>
            <span className="text-xs text-textMuted font-medium">Kapasitas {maxPlayers} Player</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activePlayers.map((p) => {
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
                    <div className="text-2xl p-2 bg-white/5 rounded-xl border border-white/10">
                      {p.profiles?.avatar_url || "🎮"}
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

          {spectatorPlayers.length > 0 && (
            <div className="pt-4 border-t border-white/10 space-y-2">
              <h3 className="text-xs font-bold text-textMuted uppercase flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-secondary" /> Penonton (Spectators)
              </h3>
              <div className="flex flex-wrap gap-2">
                {spectatorPlayers.map((p) => (
                  <span key={p.player_id} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs flex items-center gap-2">
                    <span className="text-base">{p.profiles?.avatar_url || "👀"}</span>
                    <span className="font-semibold text-white">{p.profiles?.username}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CUSTOM ROOM RULES SECTION */}
        <div className="glass-panel p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-primary" /> Aturan Pertandingan
            </h3>
            {!isHost && (
              <span className="text-xs text-textMuted italic">*Hanya Host yang bisa merubah aturan</span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs text-textMuted font-semibold flex items-center gap-1">
                <Hash className="w-3.5 h-3.5 text-secondary" /> Total Ronde: <strong className="text-white">{maxRounds} Ronde</strong>
              </label>
              {isHost ? (
                <div className="flex gap-2">
                  {[3, 5, 10].map((r) => (
                    <button
                      key={r}
                      onClick={() => updateRoomRules(r, roundTimer)}
                      className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all ${
                        maxRounds === r
                          ? "bg-primary/20 border-primary text-white shadow-[0_0_10px_rgba(139,92,246,0.3)]"
                          : "bg-white/5 border-white/10 text-textMuted hover:bg-white/10"
                      }`}
                    >
                      {r} Ronde
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white">
                  {maxRounds} Ronde
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs text-textMuted font-semibold flex items-center gap-1">
                <Timer className="w-3.5 h-3.5 text-yellow-400" /> Timer Per Soal: <strong className="text-white">{roundTimer} Detik</strong>
              </label>
              {isHost ? (
                <div className="flex gap-2">
                  {[10, 15, 20, 30].map((t) => (
                    <button
                      key={t}
                      onClick={() => updateRoomRules(maxRounds, t)}
                      className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all ${
                        roundTimer === t
                          ? "bg-yellow-500/20 border-yellow-400 text-white shadow-[0_0_10px_rgba(234,179,8,0.3)]"
                          : "bg-white/5 border-white/10 text-textMuted hover:bg-white/10"
                      }`}
                    >
                      {t}s
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white">
                  {roundTimer} Detik
                </div>
              )}
            </div>
          </div>
        </div>

        {/* PILIHAN MINI-GAME (HOST ONLY) */}
        {isHost && (
          <div className="space-y-3">
            <label className="text-sm text-textMuted font-bold">Pilih Mini-Game</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
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

              <button
                onClick={() => { sounds.playClick(); setCurrentGameId("impostor-word"); }}
                className={`p-3 rounded-xl border flex flex-col items-center text-center gap-2 transition-all ${
                  currentGameId === "impostor-word" ? "bg-red-500/20 border-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]" : "bg-white/5 border-white/10 text-textMuted hover:bg-white/10"
                }`}
              >
                <UserX className="w-5 h-5 text-red-400" />
                <div className="font-bold text-xs">Detektif Impostor</div>
              </button>

              <button
                onClick={() => { sounds.playClick(); setCurrentGameId("doodle-guess"); }}
                className={`p-3 rounded-xl border flex flex-col items-center text-center gap-2 transition-all ${
                  currentGameId === "doodle-guess" ? "bg-accent/20 border-accent text-white shadow-[0_0_15px_rgba(217,70,239,0.3)]" : "bg-white/5 border-white/10 text-textMuted hover:bg-white/10"
                }`}
              >
                <Palette className="w-5 h-5 text-accent" />
                <div className="font-bold text-xs">Tebak Gambar</div>
              </button>
            </div>
          </div>
        )}

        {/* CONTROLS START / READY */}
        <div className="glass-panel p-6 space-y-4">
          {!isHost && !myPlayerState?.is_spectator && (
            <button onClick={toggleReady} className={`w-full py-4 text-lg rounded-xl font-bold transition-all ${myPlayerState?.is_ready ? "bg-red-500/20 border-2 border-red-500 text-red-400 hover:bg-red-500/30" : "btn-primary"}`}>
              {myPlayerState?.is_ready ? "Cancel Ready" : "I'm Ready!"}
            </button>
          )}

          {myPlayerState?.is_spectator && (
            <div className="p-3 bg-secondary/10 border border-secondary/30 text-secondary rounded-xl text-center text-xs font-bold">
              👀 Kamu berada di room sebagai Penonton (Spectator)
            </div>
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
      {roomId && currentUserId && (
        <EmoteOverlay roomId={roomId} currentUserId={currentUserId} username={currentUsername} />
      )}
    </>
  );
}