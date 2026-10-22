"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Smile, Check } from "lucide-react";
import { sounds } from "@/lib/audio";

const AVATAR_PRESETS = ["🎮", "👾", "🤖", "🦊", "🐱", "🐶", "🦁", "🐼", "D", "🔥", "⚡", "👑"];

interface Props {
  userId: string;
  currentAvatar: string;
  onUpdate: (newAvatar: string) => void;
}

export default function AvatarPicker({ userId, currentAvatar, onUpdate }: Props) {
  const supabase = createClient();
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = async (emoji: string) => {
    sounds.playClick();
    onUpdate(emoji);
    setIsOpen(false);

    await supabase
      .from("profiles")
      .update({ avatar_url: emoji })
      .eq("id", userId);
  };

  return (
    <div className="relative">
      <button
        onClick={() => { sounds.playClick(); setIsOpen(!isOpen); }}
        className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-2xl transition-all relative group"
        title="Ganti Avatar"
      >
        <span>{currentAvatar || "🎮"}</span>
        <div className="absolute -bottom-1 -right-1 p-1 bg-primary rounded-full text-[10px]">
          <Smile className="w-3 h-3 text-white" />
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-14 left-0 z-50 p-3 glass-panel w-56 grid grid-cols-4 gap-2 shadow-2xl">
          {AVATAR_PRESETS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleSelect(emoji)}
              className={`p-2 rounded-xl text-xl hover:bg-white/20 transition-all flex items-center justify-center relative ${
                currentAvatar === emoji ? "bg-primary/30 border border-primary" : "bg-white/5"
              }`}
            >
              <span>{emoji}</span>
              {currentAvatar === emoji && <Check className="w-3 h-3 text-secondary absolute top-1 right-1" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}