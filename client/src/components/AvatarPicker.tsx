"use client";

import { useEffect } from "react";

export type AvatarOption = {
  id: string;
  name: string;
  emoji: string;
  available: boolean;
};

export const AVATARS: AvatarOption[] = [
  { id: "sun-buddy", name: "Нархан", emoji: "☀️", available: true },
  { id: "robot", name: "Жой", emoji: "🤖", available: true },
  { id: "rocket", name: "Пуужин", emoji: "🚀", available: false },
  { id: "dino", name: "Дино", emoji: "🦖", available: false },
];

/** Custom-drawn mascot art (emoji-аас илүү гоё, бодит дүртэй) */
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
          <line x1="18.6" y1="18.6" x2="12.9" y2="12.9" />
          <line x1="45.4" y1="18.6" x2="51.1" y2="12.9" />
          <line x1="18.6" y1="45.4" x2="12.9" y2="51.1" />
          <line x1="45.4" y1="45.4" x2="51.1" y2="51.1" />
        </g>
        <circle cx="32" cy="32" r="15" fill="url(#apSun)" />
        <circle cx="26.5" cy="30" r="2" fill="#8A5A00" />
        <circle cx="37.5" cy="30" r="2" fill="#8A5A00" />
        <path
          d="M26 36.5 Q32 41.5 38 36.5"
          stroke="#8A5A00"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (id === "robot") {
    return (
      <svg {...common}>
        <defs>
          <linearGradient id="apRobot" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#A78BFA" />
            <stop offset="100%" stopColor="#7C5FE6" />
          </linearGradient>
        </defs>
        <line
          x1="32"
          y1="15"
          x2="32"
          y2="9"
          stroke="#9CA3AF"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx="32" cy="7" r="3" fill="#FB7185" />
        <rect x="9" y="28" width="5" height="9" rx="2.5" fill="#8B6FE0" />
        <rect x="50" y="28" width="5" height="9" rx="2.5" fill="#8B6FE0" />
        <rect x="14" y="15" width="36" height="34" rx="12" fill="url(#apRobot)" />
        <rect x="19" y="22" width="26" height="20" rx="8" fill="#1F2937" />
        <circle cx="27" cy="31" r="3" fill="#5EEAD4" />
        <circle cx="37" cy="31" r="3" fill="#5EEAD4" />
        <path
          d="M27 37 Q32 40 37 37"
          stroke="#5EEAD4"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (id === "rocket") {
    return (
      <svg {...common}>
        <defs>
          <linearGradient id="apRocket" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F8FAFC" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </linearGradient>
        </defs>
        <path d="M26 42 Q32 58 38 42 Q35 48 32 44 Q29 48 26 42 Z" fill="#FB923C" />
        <path
          d="M28.5 43 Q32 52 35.5 43 Q33.7 47 32 45 Q30.3 47 28.5 43 Z"
          fill="#FACC15"
        />
        <path d="M22 34 L13 46 L23 42 Z" fill="#EF4444" strokeLinejoin="round" />
        <path d="M42 34 L51 46 L41 42 Z" fill="#EF4444" strokeLinejoin="round" />
        <path
          d="M32 5 C41 13 43 28 42 42 L22 42 C21 28 23 13 32 5 Z"
          fill="url(#apRocket)"
          stroke="#94A3B8"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <circle
          cx="32"
          cy="24"
          r="6.5"
          fill="#38BDF8"
          stroke="#0EA5E9"
          strokeWidth="2.5"
        />
      </svg>
    );
  }

  if (id === "dino") {
    return (
      <svg {...common}>
        <defs>
          <linearGradient id="apDino" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5FE08A" />
            <stop offset="100%" stopColor="#34C46B" />
          </linearGradient>
        </defs>
        <rect x="24" y="44" width="5" height="9" rx="2" fill="#2BA85A" />
        <rect x="35" y="44" width="5" height="9" rx="2" fill="#2BA85A" />
        <path
          d="M8 44 Q10 36 18 37 Q19 26 31 25 Q33 16 44 20 Q53 24 49 35 Q54 37 51 44 Q46 50 36 49 L18 49 Q11 49 8 44 Z"
          fill="url(#apDino)"
          stroke="#2BA85A"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path d="M22 36 l3 -5 l3 5 Z M31 31 l3 -5 l3 5 Z M40 28 l3 -4 l3 4 Z" fill="#2BA85A" />
        <circle cx="43" cy="29" r="2.6" fill="#fff" />
        <circle cx="43.6" cy="29" r="1.3" fill="#0F172A" />
      </svg>
    );
  }

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
    <div
      className="ap-overlay fixed inset-0 z-9990 flex items-center justify-center bg-neutral-950/70 p-4 backdrop-blur-md"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Аватар сонгох"
    >
      <div
        className="ap-modal relative w-full max-w-lg rounded-4xl border border-neutral-200/70 bg-white p-6 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.45)] sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Хаах"
          className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 transition hover:rotate-90 hover:bg-neutral-200 hover:text-neutral-900"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M1 1l12 12M13 1L1 13" />
          </svg>
        </button>

        <h2 className="text-center font-rubik text-2xl font-black tracking-tight text-neutral-900 sm:text-3xl">
          Select Avatar
        </h2>
        <p className="mx-auto mt-2 mb-7 max-w-xs text-center text-sm leading-relaxed text-neutral-400">
          Одоогоор{" "}
          <span className="font-semibold text-[#8b3dff]">
            Нархан болон Жой
          </span>{" "}
          бэлэн. Бусад найзууд тун удахгүй!
        </p>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {AVATARS.map((a, i) => {
            const isSelected = selected === a.id;
            return (
              <button
                key={a.id}
                disabled={!a.available}
                onClick={() => a.available && onSelect(a.id)}
                aria-pressed={isSelected}
                style={{ animationDelay: `${120 + i * 70}ms` }}
                className={`ap-card group relative flex aspect-square flex-col items-center justify-center gap-2.5 rounded-2xl p-3 transition-all duration-200
                  ${
                    a.available
                      ? "cursor-pointer border bg-white hover:-translate-y-1.5 hover:shadow-xl"
                      : "cursor-not-allowed border border-dashed border-neutral-200 bg-neutral-50"
                  }
                  ${
                    isSelected
                      ? "border-[#b778ff] bg-[#f6efff] shadow-[0_0_0_4px_rgba(183,120,255,0.22)]"
                      : a.available
                        ? "border-neutral-200 shadow-sm"
                        : ""
                  }`}
              >
                <span
                  className={`flex h-14 w-14 items-center justify-center rounded-full transition-transform duration-200 sm:h-16 sm:w-16
                    ${
                      a.available
                        ? "bg-[#f3eeff] group-hover:scale-110"
                        : "bg-neutral-100 opacity-40 grayscale"
                    }`}
                >
                  <AvatarArt id={a.id} className="h-9 w-9 sm:h-11 sm:w-11" />
                </span>

                <span
                  className={`font-rubik text-sm font-bold ${
                    a.available ? "text-neutral-900" : "text-neutral-400"
                  }`}
                >
                  {a.name}
                </span>

                {!a.available && (
                  <span className="mt-0.5 flex items-center gap-1 rounded-full bg-neutral-200/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                    🔒 Удахгүй
                  </span>
                )}

                {isSelected && (
                  <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#b778ff] text-white shadow-md ring-2 ring-white">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M2.5 7.5l3 3 6-7" />
                    </svg>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
