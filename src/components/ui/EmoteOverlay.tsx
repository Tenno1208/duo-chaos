"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { sounds } from "@/lib/audio";

interface FloatingEmote {
  id: string;
  emoji: string;
  username: string;
  x: number; // posisi horizontal acak
}

const EMOTE_LIST = ["🔥", "😂", "😱", "💩", "👑", "👏"];

export default function EmoteOverlay({ roomId, username }: { roomId: string; username: string }) {
  const supabase = createClient();
  const [activeEmotes, setActiveEmotes] = useState<FloatingEmote[]>([]);

  useEffect(() => {
    if (!roomId) return;

    // Supabase Realtime Broadcast Channel (Super Cepat, Tanpa Database)
    const channel = supabase.channel(`room_emotes_${roomId}`, {
      config: { broadcast: { ack: false } },
    });

    channel
      .on("broadcast", { event: "emote" }, (payload) => {
        sounds.playClick();
        const newEmote: FloatingEmote = {
          id: `${Date.now()}-${Math.random()}`,
          emoji: payload.payload.emoji,
          username: payload.payload.username,
          x: Math.floor(Math.random() * 70) + 15, // Acak posisi 15% - 85%
        };

        setActiveEmotes((prev) => [...prev, newEmote]);

        // Hapus emoji otomatis setelah animasi 2.5 detik
        setTimeout(() => {
          setActiveEmotes((prev) => prev.filter((e) => e.id !== newEmote.id));
        }, 2500);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  const sendEmote = async (emoji: string) => {
    sounds.playClick();
    const channel = supabase.channel(`room_emotes_${roomId}`);
    await channel.send({
      type: "broadcast",
      event: "emote",
      payload: { emoji, username },
    });
  };

  return (
    <>
      {/* ANIMASI EMOJI MELAYANG */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        <AnimatePresence>
          {activeEmotes.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: "80vh", scale: 0.5 }}
              animate={{ opacity: 1, y: "20vh", scale: 1.4 }}
              exit={{ opacity: 0, scale: 0.2 }}
              transition={{ duration: 2, ease: "easeOut" }}
              style={{ left: `${item.x}%` }}
              className="absolute flex flex-col items-center"
            >
              <span className="text-4xl drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                {item.emoji}
              </span>
              <span className="text-[10px] bg-black/60 backdrop-blur-md border border-white/10 px-2 py-0.5 rounded-full text-white font-semibold mt-1">
                {item.username}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* DOCK BAR TOMBOL EMOTE */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-black/60 backdrop-blur-md border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-2 shadow-2xl">
        {EMOTE_LIST.map((emoji) => (
          <button
            key={emoji}
            onClick={() => sendEmote(emoji)}
            className="text-xl hover:scale-130 active:scale-90 transition-transform p-1.5 hover:bg-white/10 rounded-xl"
            title={`Kirim ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </>
  );
}