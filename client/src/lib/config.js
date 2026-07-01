export const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3010";
export const WS_BASE = (import.meta.env.VITE_API_URL ?? "http://localhost:3010").replace(/^http/, "ws");
