export interface GameInfo {
  id: string;
  name: string;
  description: string;
  iconName: "Swords" | "BrainCircuit" | "Zap";
  minPlayers: number;
  maxPlayers: number;
}

export const GAME_REGISTRY: GameInfo[] = [
  {
    id: "truth-or-dare",
    name: "Truth or Dare",
    description: "Ungkap rahasia atau selesaikan tantangan konyol bersama teman-temanmu.",
    iconName: "Swords",
    minPlayers: 2,
    maxPlayers: 4,
  },
  {
    id: "mind-reader",
    name: "Mind Reader",
    description: "Tebak jawaban yang sama secara privat. Buktikan seberapa sefrekuensi kalian!",
    iconName: "BrainCircuit",
    minPlayers: 2,
    maxPlayers: 4,
  },
  {
    id: "speed-battle",
    name: "Speed Battle",
    description: "Adu cepat menjawab pertanyaan kuis. Siapa cepat, dia dapat poin!",
    iconName: "Zap",
    minPlayers: 2,
    maxPlayers: 4,
  },
];