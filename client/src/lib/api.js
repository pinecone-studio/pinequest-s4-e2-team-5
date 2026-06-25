import { API_BASE } from "./config.js";

export const api = {
  // AI багш яриа
  chat: (body) =>
    fetch(`${API_BASE}/api/chat`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json()),

  // Дуу
  tts: (text) =>
    fetch(`${API_BASE}/api/tts`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) }),
  stt: (audio, mimeType) =>
    fetch(`${API_BASE}/api/stt`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ audio, mimeType }) }).then((r) => r.json()),

  // Даалгавар шинжлэх
  analyzeHomework: (imageBase64, mimeType) =>
    fetch(`${API_BASE}/api/analyze-homework`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imageBase64, mimeType }) }).then((r) => r.json()),
  analyzeProblem: (problem) =>
    fetch(`${API_BASE}/api/ai/analyze`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ problem }) }).then((r) => r.json()),
  generateGame: (problem, analysis) =>
    fetch(`${API_BASE}/api/ai/generate-game`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ problem, analysis }) }).then((r) => r.json()),

  // Явц хадгалах
  createSession: (body) =>
    fetch(`${API_BASE}/api/progress/session`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json()),
  recordAttempt: (body) =>
    fetch(`${API_BASE}/api/progress/attempt`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json()),
  completeSession: (sessionId, solved) =>
    fetch(`${API_BASE}/api/progress/session/${sessionId}/complete`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ solved }) }).then((r) => r.json()),
  getAnalysis: (childId) =>
    fetch(`${API_BASE}/api/progress/${childId}/analysis`).then((r) => r.json()),

  // Hint & дасгал
  getHint: (body) =>
    fetch(`${API_BASE}/api/hints/hint`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json()),
  getPractice: (skill, difficulty, count = 3) =>
    fetch(`${API_BASE}/api/hints/practice`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ skill, difficulty, count }) }).then((r) => r.json()),
};
