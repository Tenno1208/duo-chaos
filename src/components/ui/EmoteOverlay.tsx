"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, X } from "lucide-react";
import VoiceChat from "@/components/ui/VoiceChat";
import { sounds } from "@/lib/audio";

interface Props {
  roomId: string;
  currentUserId: string;
  username: string;
}

const EMOTES = ["🔥", "😂", "😱", "💩", "👑", "👏"];

export default function EmoteOverlay({ roomId, currentUserId, username }: Props) {
  const supabase = createClient();
  const [messages, setMessages] = useState<{ id: string; text: string; username: string; type: "emote" | "chat" }[]>([]);
  const [showChatInput, setShowChatInput] = useState(false);
  const [chatText, setChatText] = useState("");

  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`room_emotes_${roomId}`)
      .on("broadcast", { event: "send_emote" }, (payload) => {
        const { text, username: senderName, type } = payload.payload;
        const id = Math.random().toString();
        setMessages((prev) => [...prev, { id, text, username: senderName, type }]);

        setTimeout(() => {
          setMessages((prev) => prev.filter((m) => m.id !== id));
        }, 3000);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  const sendEmoteOrChat = async (text: string, type: "emote" | "chat") => {
    sounds.playClick();
    const channel = supabase.channel(`room_emotes_${roomId}`);
    await channel.send({
      type: "broadcast",
      event: "send_emote",
      payload: { text, username, type },
    });
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatText.trim()) return;
    sendEmoteOrChat(chatText.trim(), "chat");
    setChatText("");
    setShowChatInput(false);
  };

  return (
    <>
      {/* BUBBLE PESAN / EMOTE DI LAYAR */}
      <div className="fixed inset-0 pointer-events-none z-50 flex flex-col items-center justify-center space-y-3 overflow-hidden">
        <AnimatePresence>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, scale: 0.5, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              className="bg-black/80 backdrop-blur-md border border-white/20 px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-2"
            >
              <span className="text-xs font-bold text-secondary">{m.username}:</span>
              <span className={m.type === "emote" ? "text-2xl" : "text-sm text-white font-medium"}>{m.text}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* DOCK BAR MELAYANG BAWAH (VOICE CHAT + CHAT + EMOTE) */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 bg-black/70 backdrop-blur-xl border border-white/15 px-3 py-2 rounded-2xl shadow-2xl max-w-[95vw] overflow-x-auto">
        {/* TOMBOL VOICE CHAT REALTIME */}
        <VoiceChat roomId={roomId} currentUserId={currentUserId} />

        <div className="w-[1px] h-6 bg-white/20 mx-0.5" />

        {/* TOMBOL PESAN CHAT */}
        <button
          onClick={() => { sounds.playClick(); setShowChatInput(!showChatInput); }}
          className="px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all text-white whitespace-nowrap"
        >
          <MessageSquare className="w-4 h-4 text-secondary" />
          <span>Pesan</span>
        </button>

        {/* QUICK EMOTES */}
        <div className="flex items-center gap-1">
          {EMOTES.map((emoji) => (
            <button
              key={emoji}
              onClick={() => sendEmoteOrChat(emoji, "emote")}
              className="p-1.5 hover:bg-white/15 rounded-xl text-lg transition-transform hover:scale-125 active:scale-90"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* INPUT MODAL PESAN */}
      {showChatInput && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleChatSubmit}
            className="glass-panel p-4 w-full max-w-md space-y-3 relative"
          >
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-textMuted uppercase">Kirim Pesan Singkat</span>
              <button type="button" onClick={() => setShowChatInput(false)} className="p-1 hover:bg-white/10 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                autoFocus
                maxLength={50}
                value={chatText}
                onChange={(e) => setChatText(e.target.value)}
                placeholder="Ketik pesan..."
                className="input-neon text-xs flex-1"
              />
              <button type="submit" className="btn-primary px-4 py-2 text-xs flex items-center gap-1">
                <Send className="w-3.5 h-3.5" /> Kirim
              </button>
            </div>
          </motion.form>
        </div>
      )}
    </>
  );
}