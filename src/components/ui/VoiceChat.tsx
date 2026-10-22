"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Mic, MicOff } from "lucide-react";
import { sounds } from "@/lib/audio";

export default function VoiceChat({ roomId, currentUserId }: { roomId: string; currentUserId: string }) {
  const supabase = createClient();
  const [isMicOn, setIsMicOn] = useState(false);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Record<string, RTCPeerConnection>>({});

  useEffect(() => {
    if (!roomId) return;

    const channel = supabase.channel(`room_voice_${roomId}`);

    channel
      .on("broadcast", { event: "signal" }, async (payload) => {
        const { senderId, signal } = payload.payload;
        if (senderId === currentUserId) return;

        let pc = peerConnectionsRef.current[senderId];

        if (!pc) {
          pc = createPeerConnection(senderId, channel);
          peerConnectionsRef.current[senderId] = pc;
        }

        if (signal.sdp) {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          if (signal.sdp.type === "offer") {
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            channel.send({
              type: "broadcast",
              event: "signal",
              payload: { senderId: currentUserId, signal: { sdp: pc.localDescription } },
            });
          }
        } else if (signal.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        }
      })
      .subscribe();

    return () => {
      stopMic();
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  const createPeerConnection = (peerId: string, channel: any) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        channel.send({
          type: "broadcast",
          event: "signal",
          payload: { senderId: currentUserId, signal: { candidate: event.candidate } },
        });
      }
    };

    pc.ontrack = (event) => {
      const audioEl = new Audio();
      audioEl.srcObject = event.streams[0];
      audioEl.play();
    };

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    return pc;
  };

  const toggleMic = async () => {
    sounds.playClick();
    if (isMicOn) {
      stopMic();
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        localStreamRef.current = stream;
        setIsMicOn(true);

        const channel = supabase.channel(`room_voice_${roomId}`);
        const pc = createPeerConnection("all", channel);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        channel.send({
          type: "broadcast",
          event: "signal",
          payload: { senderId: currentUserId, signal: { sdp: pc.localDescription } },
        });
      } catch (err) {
        alert("Gagal mengaktifkan mikrofon!");
      }
    }
  };

  const stopMic = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    setIsMicOn(false);
  };

  return (
    <button
      onClick={toggleMic}
      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
        isMicOn
          ? "bg-green-500/20 border-green-500/50 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.3)] animate-pulse"
          : "bg-white/5 border-white/10 text-textMuted hover:text-white"
      }`}
      title={isMicOn ? "Mute Mic" : "Unmute Mic"}
    >
      {isMicOn ? <Mic className="w-4 h-4 text-green-400" /> : <MicOff className="w-4 h-4 text-red-400" />}
      <span className="hidden sm:inline">{isMicOn ? "Voice On" : "Voice Off"}</span>
    </button>
  );
}