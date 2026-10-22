"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Timer } from "lucide-react";

interface Props {
  seconds: number;
  onTimeUp?: () => void;
}

export default function CountdownTimer({ seconds, onTimeUp }: Props) {
  const [timeLeft, setTimeLeft] = useState(seconds);

  useEffect(() => {
    setTimeLeft(seconds);
  }, [seconds]);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (onTimeUp) onTimeUp();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onTimeUp]);

  const percentage = (timeLeft / seconds) * 100;
  const isCritical = timeLeft <= 5;

  return (
    <div className="w-full space-y-1">
      <div className="flex justify-between items-center text-xs font-bold">
        <span className={`flex items-center gap-1 ${isCritical ? "text-red-400 animate-pulse" : "text-textMuted"}`}>
          <Timer className="w-3.5 h-3.5" /> Waktu Tersisa
        </span>
        <span className={isCritical ? "text-red-400 font-extrabold text-sm animate-bounce" : "text-secondary"}>
          {timeLeft}s
        </span>
      </div>

      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/5">
        <motion.div
          initial={{ width: "100%" }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.3 }}
          className={`h-full rounded-full transition-colors ${
            isCritical
              ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]"
              : "bg-gradient-to-r from-primary to-secondary"
          }`}
        />
      </div>
    </div>
  );
}