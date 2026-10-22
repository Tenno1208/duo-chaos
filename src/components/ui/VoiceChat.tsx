"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Mic, MicOff } from "lucide-react";
import { sounds } from "@/lib/audio";

interface Props {
  roomId: string;
  currentUserId: string;
}

export default function VoiceChat({ roomId, currentUserId }: Props) {
  const supabase = createClient();
  const [isMicOn, setIsMicOn] = useState(false);
  
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Record<string, RTCPeerConnection>>({});
  const audioElementsRef = useRef<Record<string, HTMLAudioElement>>({});

  useEffect(() => {
    if (!roomId || !currentUserId) return;

    const channel = supabase.channel(`room_voice_${roomId}`);

    channel
      .on("broadcast", { event: "signal" }, async (payload) => {
        const { senderId, targetId, signal } = payload.payload;
        
        // Abaikan sinyal dari diri sendiri atau sinyal yang ditujukan ke player lain
        if (senderId === currentUserId) return;
        if (targetId && targetId !== currentUserId) return;

        let pc = peerConnectionsRef.current[senderId];

        if (!pc) {
          pc = createPeerConnection(senderId, channel);
          peerConnectionsRef.current[senderId] = pc;
        }

        try {
          if (signal.sdp) {
            await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
            
            if (signal.sdp.type === "offer") {
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              channel.send({
                type: "broadcast",
                event: "signal",
                payload: { senderId: currentUserId, targetId: senderId, signal: { sdp: pc.localDescription } },
              });
            }
          } else if (signal.candidate) {
            if (pc.remoteDescription) {
              await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
            }
          }
        } catch (err) {
          console.error("Voice signal error:", err);
        }
      })
      .on("broadcast", { event: "user_joined_voice" }, async (payload) => {
        const { senderId } = payload.payload;
        if (senderId === currentUserId || !localStreamRef.current) return;

        // Bikin offer baru untuk pemain yang baru mengaktifkan mic
        const pc = createPeerConnection(senderId, channel);
        peerConnectionsRef.current[senderId] = pc;

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        channel.send({
          type: "broadcast",
          event: "signal",
          payload: { senderId: currentUserId, targetId: senderId, signal: { sdp: pc.localDescription } },
        });
      })
      .subscribe();

    return () => {
      stopMic();
      supabase.removeChannel(channel);
    };
  }, [roomId, currentUserId]);

  const createPeerConnection = (peerId: string, channel: any) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" }
      ],
    });

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        channel.send({
          type: "broadcast",
          event: "signal",
          payload: { senderId: currentUserId, targetId: peerId, signal: { candidate: event.candidate } },
        });
      }
    };

    pc.ontrack = (event) => {
      // Tempelkan elemen audio ke document.body agar tidak terhapus browser
      let audioEl = audioElementsRef.current[peerId];
      if (!audioEl) {
        audioEl = document.createElement("audio");
        audioEl.autoplay = true;
        audioEl.playsInline = true;
        document.body.appendChild(audioEl);
        audioElementsRef.current[peerId] = audioEl;
      }
      audioEl.srcObject = event.streams[0];
      audioEl.play().catch((e) => console.log("Audio play blocked:", e));
    };

    return pc;
  };

  const toggleMic = async () => {
    sounds.playClick();
    if (isMicOn) {
      stopMic();
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          } 
        });
        localStreamRef.current = stream;
        setIsMicOn(true);

        const channel = supabase.channel(`room_voice_${roomId}`);
        
        channel.send({
          type: "broadcast",
          event: "user_joined_voice",
          payload: { senderId: currentUserId },
        });
      } catch (err) {
        alert("Gagal mengaktifkan mikrofon! Pastikan izin mic diberikan di browser.");
      }
    }
  };

  const stopMic = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }

    Object.keys(peerConnectionsRef.current).forEach((peerId) => {
      peerConnectionsRef.current[peerId].close();
    });
    peerConnectionsRef.current = {};

    Object.keys(audioElementsRef.current).forEach((peerId) => {
      const el = audioElementsRef.current[peerId];
      if (el && el.parentNode) el.parentNode.removeChild(el);
    });
    audioElementsRef.current = {};

    setIsMicOn(false);
  };

  return (
    <button
      onClick={toggleMic}
      className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all text-white whitespace-nowrap ${
        isMicOn
          ? "bg-green-500/20 border-green-500/50 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.3)] animate-pulse"
          : "bg-white/10 hover:bg-white/20 border-white/10 text-textMuted hover:text-white"
      }`}
      title={isMicOn ? "Mute Mic" : "Unmute Mic"}
    >
      {isMicOn ? <Mic className="w-4 h-4 text-green-400" /> : <MicOff className="w-4 h-4 text-red-400" />}
      <span>{isMicOn ? "Voice On" : "Voice Off"}</span>
    </button>
  );
}