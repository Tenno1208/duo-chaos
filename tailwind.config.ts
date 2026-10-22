import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/modules/**/*.{js,ts,jsx,tsx,mdx}", // Penting: Agar Tailwind membaca folder modules kita
  ],
  theme: {
    extend: {
      colors: {
        background: "#080811",
        panel: "rgba(30, 20, 50, 0.6)",
        primary: {
          DEFAULT: "#8b5cf6", // Electric violet
          glow: "rgba(139, 92, 246, 0.5)",
        },
        secondary: {
          DEFAULT: "#06b6d4", // Neon cyan
          glow: "rgba(6, 182, 212, 0.5)",
        },
        accent: {
          DEFAULT: "#ec4899", // Pink/Fuchsia
        },
        textMain: "#f8fafc", // Putih lembut
        textMuted: "#94a3b8", // Slate
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)',
      }
    },
  },
  plugins: [],
};
export default config;