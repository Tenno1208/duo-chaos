import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import Navbar from "@/components/layout/Navbar";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DUO CHAOS | Two Players. Unlimited Chaos.",
  description: "Platform mini-game multiplayer real-time untuk 2-4 pemain.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={cn(outfit.className, "min-h-screen overflow-x-hidden relative flex flex-col")}>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        
        {/* NAVBAR GLOBAL */}
        <Navbar />

        <main className="container mx-auto max-w-md md:max-w-4xl px-4 py-6 relative z-10 flex-1 flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}