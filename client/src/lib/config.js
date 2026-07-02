export const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3010";
export const WS_BASE = (import.meta.env.VITE_API_URL ?? "http://localhost:3010").replace(/^http/, "ws");

// WebRTC ICE servers: public STUN by default; TURN (needed for reliable
// connectivity across restrictive NATs/firewalls) is opt-in via env vars.
export const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  ...(import.meta.env.VITE_TURN_URL
    ? [
        {
          urls: import.meta.env.VITE_TURN_URL,
          username: import.meta.env.VITE_TURN_USERNAME,
          credential: import.meta.env.VITE_TURN_CREDENTIAL,
        },
      ]
    : []),
];
