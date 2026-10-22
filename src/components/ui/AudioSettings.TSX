"use client";

import { useState } from "react";
import { Volume2, VolumeX, Sliders, X } from "lucide-react";
import { sounds } from "@/lib/audio";

export default function AudioSettings() {
  const [isOpen, setIsOpen] = useState(false);
  const [bgmVol, setBgmVol] = useState(sounds.bgmVolume * 100);
  const [sfxVol, setSfxVol] = useState(sounds.sfxVolume * 100);
  const [isMuted, setIsMuted] = useState(sounds.isMuted);

  const handleBgmChange = (val: number) => {
    setBgmVol(val);
    sounds.setBGMVolume(val / 100);
  };

  const handleSfxChange = (val: number) => {
    setSfxVol(val);
    sounds.setSFXVolume(val / 100);
  };

  const handleToggleMute = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  return (
    <>
      <button
        onClick={() => { sounds.playClick(); setIsOpen(!isOpen); }}
        className="p-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-white transition-all"
        title="Pengaturan Suara"
      >
        <Sliders className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 w-full max-w-xs space-y-5 relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-secondary" /> Pengaturan Suara
              </h3>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/10 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-textMuted font-bold">
                  <span>Musik Latar (BGM)</span>
                  <span>{bgmVol}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={bgmVol}
                  onChange={(e) => handleBgmChange(Number(e.target.value))}
                  className="w-full accent-secondary cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-textMuted font-bold">
                  <span>Efek Suara (SFX)</span>
                  <span>{sfxVol}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sfxVol}
                  onChange={(e) => handleSfxChange(Number(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />
              </div>

              <button
                onClick={handleToggleMute}
                className={`w-full py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  isMuted ? "bg-red-500/20 border-red-500 text-red-400" : "bg-white/5 border-white/10 text-textMuted hover:text-white"
                }`}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                {isMuted ? "Unmute Semua Audio" : "Mute Semua Audio"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}