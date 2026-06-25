const BASE = "http://localhost:3000";

export const api = {
  // AI багш яриа
  chat: (body) =>
    fetch(`${BASE}/api/chat`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json()),

  // Дуу
  tts: (text) =>
    fetch(`${BASE}/api/tts`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) }),
  stt: (audio, mimeType) =>
    fetch(`${BASE}/api/stt`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ audio, mimeType }) }).then((r) => r.json()),

  // Даалгавар шинжлэх
  analyzeHomework: (imageBase64, mimeType) =>
    fetch(`${BASE}/api/analyze-homework`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imageBase64, mimeType }) }).then((r) => r.json()),
  analyzeProblem: (problem) =>
    fetch(`${BASE}/api/ai/analyze`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ problem }) }).then((r) => r.json()),
  generateGame: (problem, analysis) =>
    fetch(`${BASE}/api/ai/generate-game`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ problem, analysis }) }).then((r) => r.json()),

  // Явц хадгалах
  createSession: (body) =>
    fetch(`${BASE}/api/progress/session`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json()),
  recordAttempt: (body) =>
    fetch(`${BASE}/api/progress/attempt`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json()),
  completeSession: (sessionId, solved) =>
    fetch(`${BASE}/api/progress/session/${sessionId}/complete`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ solved }) }).then((r) => r.json()),
  getAnalysis: (childId) =>
    fetch(`${BASE}/api/progress/${childId}/analysis`).then((r) => r.json()),

  // Hint & дасгал
  getHint: (body) =>
    fetch(`${BASE}/api/hints/hint`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json()),
  getPractice: (skill, difficulty, count = 3) =>
    fetch(`${BASE}/api/hints/practice`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ skill, difficulty, count }) }).then((r) => r.json()),
};
