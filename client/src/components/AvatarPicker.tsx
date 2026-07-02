"use client";

import { useEffect } from "react";

export type AvatarOption = {
  id: string;
  name: string;
  emoji: string;
  available: boolean;
};

export const AVATARS: AvatarOption[] = [
  { id: "robot", name: "Robi", emoji: "🤖", available: true },
  { id: "minecraft", name: "Minecraft", emoji: "🟩", available: true },
  { id: "astronaut", name: "Сансрын нисгэгч", emoji: "🧑🏻‍🚀", available: true },
  { id: "barbie", name: "Barbie", emoji: "🧚🏻‍♀️", available: true },
];

export function CreeperFace({ className }: { className?: string }) {
  return <img src="Minecraft1.png" alt="Minecraft" className={className} />;
}

export function McQueenCar({ className }: { className?: string }) {
  return <img src="McQueen1.png" alt="McQueen" className={className} />;
}

function AvatarArt({ id, className }: { id: string; className?: string }) {
  const common = {
    viewBox: "0 0 64 64",
    className,
    fill: "none" as const,
    xmlns: "http://www.w3.org/2000/svg",
  };

  if (id === "sun-buddy") {
    return (
      <svg {...common}>
        <defs>
          <radialGradient id="apSun" cx="50%" cy="42%" r="60%">
            <stop offset="0%" stopColor="#FFE48A" />
            <stop offset="100%" stopColor="#F59E0B" />
          </radialGradient>
        </defs>
        <g stroke="#FBBF24" strokeWidth="3" strokeLinecap="round">
          <line x1="32" y1="13" x2="32" y2="5" />
          <line x1="32" y1="51" x2="32" y2="59" />
          <line x1="13" y1="32" x2="5" y2="32" />
          <line x1="51" y1="32" x2="59" y2="32" />
        </g>
        <circle cx="32" cy="32" r="15" fill="url(#apSun)" />
        <circle cx="26.5" cy="30" r="2" fill="#8A5A00" />
        <circle cx="37.5" cy="30" r="2" fill="#8A5A00" />
        <path d="M26 36.5 Q32 41.5 38 36.5" stroke="#8A5A00" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    );
  }

  if (id === "robot") return <img src="Joy1.png" alt="Robot" className={className} />;
  
  // 💡 Fixed: Keep the tiny picker button fast by using a flat image preview
  if (id === "astronaut") return <img src="astronaut1.png" alt="Astronaut" className={className} />;
  if (id === "barbie") return <img src="barbie1.png" alt="Barbie" className={className} />;
  if (id === "minecraft") return <CreeperFace className={className} />;
  if (id === "mcqueen") return <McQueenCar className={className} />;

  return null;
}

export default function AvatarPicker({
  selected,
  onSelect,
  onClose,
}: {
  selected: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="ap-overlay fixed inset-0 z-9990 flex items-center justify-center bg-neutral-950/70 p-4 backdrop-blur-md" onClick={onClose} role="dialog" aria-modal="true">
      <div className="ap-modal relative w-full max-w-lg rounded-4xl border border-neutral-200/70 bg-white p-6 shadow-2xl sm:p-8" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} aria-label="Хаах" className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 transition hover:rotate-90 hover:bg-neutral-200">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 1l12 12M13 1L1 13" /></svg>
        </button>

        <h2 className="text-center font-rubik text-2xl font-black text-neutral-900 sm:text-3xl">Найзаа сонгоорой</h2>
        <p className="mx-auto mt-2 mb-7 text-center text-sm text-neutral-400">Өнөөдөр <span className="font-semibold text-[#8b3dff]">хэнтэй хамт</span> гэрийн даалгавараа хиймээр байна?</p>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {AVATARS.map((a, i) => {
            const isSelected = selected === a.id;
            return (
              <button
                key={a.id}
                disabled={!a.available}
                onClick={() => a.available && onSelect(a.id)}
                style={{ animationDelay: `${120 + i * 70}ms` }}
                className={`ap-card group relative flex aspect-square flex-col items-center justify-center gap-2.5 rounded-2xl p-3 transition-all duration-200
                  ${a.available ? "cursor-pointer border bg-white hover:-translate-y-1.5 hover:shadow-xl" : "cursor-not-allowed border border-dashed border-neutral-200 bg-neutral-50"}
                  ${isSelected ? "border-[#b778ff] bg-[#f6efff] shadow-[0_0_0_4px_rgba(183,120,255,0.22)]" : "border-neutral-200 shadow-sm"}`}
              >
                <span className={`flex h-16 w-16 items-center justify-center overflow-hidden rounded-full transition-transform duration-200 sm:h-20 sm:w-20 ${a.available ? "bg-[#f3eeff] group-hover:scale-110" : "bg-neutral-100 opacity-40 grayscale"}`}>
                  <AvatarArt id={a.id} className="h-11 w-11 sm:h-14 sm:w-14 object-contain" />
                </span>
                <span className="font-rubik text-sm font-bold text-neutral-900">{a.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}