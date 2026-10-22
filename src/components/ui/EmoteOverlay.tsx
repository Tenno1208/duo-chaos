"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { sounds } from "@/lib/audio";
import { MessageSquare } from "lucide-react";

interface FloatingItem {
  id: string;
  type: "emote" | "chat";
  content: string;
  username: string;
  x: number;
}

const EMOTE_LIST = ["🔥", "😂", "😱", "💩", "👑", "👏"];
const CHAT_PRESETS = [
  "Wkwk ngakak! 🤣",
  "Beneran nih? 🤔",
  "Gas cepetan woy! ⚡",
  "Bohong tuh! 🤥",
  "Hoki doang! 😜",
  "GG WP! 🔥",
];

export default function EmoteOverlay({ roomId, username }: { roomId: string; username: string }) {
  const supabase = createClient();
  const [floatingItems, setFloatingItems] = useState<FloatingItem[]>([]);
  const [showChatMenu, setShowChatMenu] = useState(false);

  useEffect(() => {
    if (!roomId) return;

    // Supabase Realtime Broadcast Channel (Super Cepat)
    const channel = supabase.channel(`room_emotes_${roomId}`, {
      config: { broadcast: { ack: false } },
    });

    channel
      .on("broadcast", { event: "reaction" }, (payload) => {
        sounds.playClick();
        const newItem: FloatingItem = {
          id: `${Date.now()}-${Math.random()}`,
          type: payload.payload.type,
          content: payload.payload.content,
          username: payload.payload.username,
          x: Math.floor(Math.random() * 60) + 20, // Posisi acak 20% - 80%
        };

        setFloatingItems((prev) => [...prev, newItem]);

        // Hapus item otomatis setelah animasi 2.5 detik
        setTimeout(() => {
          setFloatingItems((prev) => prev.filter((e) => e.id !== newItem.id));
        }, 2500);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  const sendReaction = async (type: "emote" | "chat", content: string) => {
    sounds.playClick();
    setShowChatMenu(false);
    const channel = supabase.channel(`room_emotes_${roomId}`);
    await channel.send({
      type: "broadcast",
      event: "reaction",
      payload: { type, content, username },
    });
  };

  return (
    <>
      {/* ANIMASI FLOATING REACTION (EMOJI & QUICK CHAT) */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        <AnimatePresence>
          {floatingItems.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: "85vh", scale: 0.6 }}
              animate={{ opacity: 1, y: "25vh", scale: 1 }}
              exit={{ opacity: 0, scale: 0.3 }}
              transition={{ duration: 2.2, ease: "easeOut" }}
              style={{ left: `${item.x}%` }}
              className="absolute flex flex-col items-center"
            >
              {item.type === "emote" ? (
                <span className="text-4xl drop-shadow-[0_0_12px_rgba(255,255,255,0.6)]">
                  {item.content}
                </span>
              ) : (
                <div className="bg-primary/90 text-white border border-primary/50 backdrop-blur-md px-4 py-2 rounded-2xl shadow-[0_0_20px_rgba(139,92,246,0.5)] font-bold text-sm whitespace-nowrap">
                  "{item.content}"
                </div>
              )}

              <span className="text-[10px] bg-black/70 backdrop-blur-md border border-white/10 px-2 py-0.5 rounded-full text-textMuted font-semibold mt-1">
                {item.username}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* DOCK BAR REAKSI (EMOTE + QUICK CHAT POPUP) */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2">
        {/* POPUP MENU QUICK CHAT */}
        <AnimatePresence>
          {showChatMenu && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="bg-black/80 backdrop-blur-lg border border-white/15 p-3 rounded-2xl grid grid-cols-2 gap-2 shadow-2xl max-w-xs"
            >
              {CHAT_PRESETS.map((msg) => (
                <button
                  key={msg}
                  onClick={() => sendReaction("chat", msg)}
                  className="text-xs bg-white/5 hover:bg-white/15 border border-white/10 text-white font-medium p-2 rounded-xl text-left transition-all active:scale-95"
                >
                  {msg}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* DOCK BAR */}
        <div className="bg-black/70 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-2xl flex items-center gap-2 shadow-2xl">
          <button
            onClick={() => { sounds.playClick(); setShowChatMenu((prev) => !prev); }}
            className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all ${
              showChatMenu ? "bg-primary text-white border-primary" : "bg-white/10 text-textMuted border-white/10 hover:text-white"
            }`}
            title="Pesan Cepat"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Pesan</span>
          </button>

          <div className="w-[1px] h-6 bg-white/10 mx-1" />

          {EMOTE_LIST.map((emoji) => (
            <button
              key={emoji}
              onClick={() => sendReaction("emote", emoji)}
              className="text-lg hover:scale-125 active:scale-90 transition-transform p-1 hover:bg-white/10 rounded-xl"
              title={`Kirim ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}