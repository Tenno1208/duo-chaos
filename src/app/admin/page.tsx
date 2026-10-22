"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { Plus, Trash2, ArrowLeft, Loader2, Database } from "lucide-react";

interface Question {
  id: string;
  game_id: string;
  type: string;
  category: string;
  content: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const supabase = createClient();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedGame, setSelectedGame] = useState<string>("truth-or-dare");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [gameId, setGameId] = useState("truth-or-dare");
  const [type, setType] = useState("truth");
  const [category, setCategory] = useState("funny");
  const [content, setContent] = useState("");
  const [optionsStr, setOptionsStr] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");

  useEffect(() => {
    fetchQuestions();
  }, [selectedGame]);

  async function fetchQuestions() {
    setLoading(true);
    const { data } = await supabase
      .from("questions")
      .select("id, game_id, type, category, content")
      .eq("game_id", selectedGame)
      .order("created_at", { ascending: false });

    if (data) setQuestions(data as Question[]);
    setLoading(false);
  }

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let optionsJson = null;
      if (optionsStr) {
        optionsJson = optionsStr.split(",").map((s) => s.trim());
      }

      const { error } = await supabase.from("questions").insert({
        game_id: gameId,
        type: type,
        category: category,
        content: content,
        options: optionsJson ? JSON.stringify(optionsJson) : null,
        correct_answer: correctAnswer || null,
      });

      if (error) throw error;

      setContent("");
      setOptionsStr("");
      setCorrectAnswer("");
      alert("Pertanyaan berhasil ditambahkan!");
      fetchQuestions();
    } catch (err: any) {
      alert(err.message || "Gagal menambah pertanyaan.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus pertanyaan ini?")) return;

    await supabase.from("questions").delete().eq("id", id);
    fetchQuestions();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-6">
      <button onClick={() => router.push("/")} className="flex items-center gap-2 text-textMuted hover:text-white transition-colors text-sm font-semibold">
        <ArrowLeft className="w-4 h-4" /> Kembali ke Home
      </button>

      <div className="flex items-center gap-3">
        <div className="p-3 bg-primary/20 border border-primary/30 rounded-2xl text-primary">
          <Database className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black">Admin Dashboard</h1>
          <p className="text-xs text-textMuted">Kelola bank pertanyaan mini-game DUO CHAOS.</p>
        </div>
      </div>

      {/* FORM TAMBAH SOAL */}
      <motion.form initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleAddQuestion} className="glass-panel p-6 space-y-4">
        <h2 className="text-base font-bold flex items-center gap-2">
          <Plus className="w-4 h-4 text-secondary" /> Tambah Pertanyaan Baru
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-textMuted font-semibold">Mini-Game</label>
            <select value={gameId} onChange={(e) => setGameId(e.target.value)} className="input-neon text-xs">
              <option value="truth-or-dare" className="bg-background">Truth or Dare</option>
              <option value="mind-reader" className="bg-background">Mind Reader</option>
              <option value="speed-battle" className="bg-background">Speed Battle</option>
              <option value="most-likely-to" className="bg-background">Most Likely To</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-textMuted font-semibold">Tipe Soal</label>
            <input type="text" value={type} onChange={(e) => setType(e.target.value)} placeholder="truth/dare/multiple_choice" className="input-neon text-xs" required />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-textMuted font-semibold">Kategori</label>
            <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="funny/friendship" className="input-neon text-xs" required />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-textMuted font-semibold">Isi Pertanyaan / Tantangan</label>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Tuliskan pertanyaan di sini..." className="input-neon text-xs h-20" required />
        </div>

        {(gameId === "mind-reader" || gameId === "speed-battle") && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-textMuted font-semibold">Pilihan Jawaban (Pisahkan dengan koma)</label>
              <input type="text" value={optionsStr} onChange={(e) => setOptionsStr(e.target.value)} placeholder="Opsi 1, Opsi 2, Opsi 3, Opsi 4" className="input-neon text-xs" />
            </div>

            {gameId === "speed-battle" && (
              <div className="space-y-1">
                <label className="text-xs text-textMuted font-semibold">Kunci Jawaban Benar</label>
                <input type="text" value={correctAnswer} onChange={(e) => setCorrectAnswer(e.target.value)} placeholder="Harus persis sama dengan salah satu opsi" className="input-neon text-xs" />
              </div>
            )}
          </div>
        )}

        <button type="submit" disabled={submitting} className="btn-primary py-2.5 px-5 text-xs">
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Simpan Pertanyaan"}
        </button>
      </motion.form>

      {/* DAFTAR SOAL TERSEDIA */}
      <div className="glass-panel p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-textMuted">Daftar Pertanyaan di Database</h2>
          <select value={selectedGame} onChange={(e) => setSelectedGame(e.target.value)} className="bg-white/10 border border-white/10 rounded-xl px-3 py-1.5 text-xs font-semibold text-white">
            <option value="truth-or-dare" className="bg-background">Truth or Dare</option>
            <option value="mind-reader" className="bg-background">Mind Reader</option>
            <option value="speed-battle" className="bg-background">Speed Battle</option>
            <option value="most-likely-to" className="bg-background">Most Likely To</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-2">
            {questions.map((q) => (
              <div key={q.id} className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between text-xs gap-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded uppercase font-bold mr-2">{q.type}</span>
                  <span className="text-white font-medium">"{q.content}"</span>
                </div>
                <button onClick={() => handleDelete(q.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}