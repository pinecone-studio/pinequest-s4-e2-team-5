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
  { id: "robot", name: "Робот", emoji: "🤖", available: true },
  { id: "rocket", name: "Пуужин", emoji: "🚀", available: false },
  { id: "dino", name: "Дино", emoji: "🦖", available: false },
];

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
          <span className="font-semibold text-[#8b3dff]">Нархан</span> бэлэн.
          Бусад найзууд тун удахгүй!
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
                  className={`flex h-14 w-14 items-center justify-center rounded-full text-3xl transition-transform duration-200 sm:h-16 sm:w-16 sm:text-4xl
                    ${
                      a.available
                        ? "bg-[#f3eeff] group-hover:scale-110"
                        : "bg-neutral-100 opacity-40 grayscale"
                    }`}
                >
                  {a.emoji}
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
