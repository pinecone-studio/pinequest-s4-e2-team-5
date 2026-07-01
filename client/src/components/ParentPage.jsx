import { useCallback, useEffect, useRef, useState } from "react";
import { WS_BASE } from "../lib/config.js";

export default function ParentPage({ onBack }) {
  const [step, setStep] = useState("input");
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [status, setStatus] = useState("idle");
  const [screenOn, setScreenOn] = useState(false);
  const inputRefs = useRef([]);
  const wsRef = useRef(null);
  const cameraCanvasRef = useRef(null);
  const screenCanvasRef = useRef(null);

  const code = digits.join("");

  useEffect(() => { inputRefs.current[0]?.focus(); }, []);

  const handleDigit = (i, val) => {
    const v = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = v;
    setDigits(next);
    if (v && i < 5) inputRefs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) inputRefs.current[i - 1]?.focus();
    if (e.key === "Enter" && code.length === 6) connect();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(""));
      inputRefs.current[5]?.focus();
    }
    e.preventDefault();
  };

  const connect = useCallback(() => {
    if (code.length !== 6) return;
    setStep("viewing");
    setStatus("connecting");
  }, [code]);

  useEffect(() => {
    if (step !== "viewing") return;
    const ws = new WebSocket(`${WS_BASE}/ws?role=parent&code=${code}`);
    wsRef.current = ws;

    ws.onopen = () => setStatus("waiting");

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === "child-disconnected") { setStatus("offline"); return; }
        if (msg.type === "screen-disconnected") { setScreenOn(false); return; }
        if (msg.type === "camera" && msg.data) {
          setStatus("live");
          const canvas = cameraCanvasRef.current;
          if (!canvas) return;
          const img = new Image();
          img.onload = () => {
            const ctx = canvas.getContext("2d");
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
          };
          img.src = msg.data;
        }
        if (msg.type === "screen" && msg.data) {
          setScreenOn(true);
          const canvas = screenCanvasRef.current;
          if (!canvas) return;
          const img = new Image();
          img.onload = () => {
            const ctx = canvas.getContext("2d");
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
          };
          img.src = msg.data;
        }
      } catch {}
    };

    ws.onclose = () => setStatus((s) => s === "offline" ? s : "idle");
    ws.onerror = () => setStatus("error");

    return () => { ws.close(); wsRef.current = null; };
  }, [step, code]);

  const goBack = () => {
    wsRef.current?.close();
    setStep("input");
    setStatus("idle");
    setScreenOn(false);
    onBack();
  };

  return (
    <div style={pageWrap}>
      <div style={topBar}>
        <button style={backBtn} onClick={goBack}>← Буцах</button>
        <span style={topTitle}>
          {step === "input" ? "Эцэг эхийн хяналт" : `Код: ${code}`}
        </span>
        {step === "viewing" && (
          <div style={statusBadge}>
            <div style={{ ...statusDot, background: dotColor(status) }} />
            <span style={statusLabel}>{statusText(status)}</span>
          </div>
        )}
      </div>

      {step === "input" && (
        <div style={inputWrap}>
          <div style={inputCard}>
            <p style={inputTitle}>Хүүхдийн дэлгэц дээрх</p>
            <p style={inputSubtitle}>6 оронтой кодыг оруулна уу</p>
            <div style={digitRow} onPaste={handlePaste}>
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleDigit(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  style={{ ...digitInput, borderColor: d ? "#185d56" : "rgba(22,43,42,0.15)", background: d ? "#f0faf8" : "#fff" }}
                />
              ))}
            </div>
            <button
              style={{ ...actionBtn, opacity: code.length === 6 ? 1 : 0.4 }}
              disabled={code.length !== 6}
              onClick={connect}
            >
              Хянах эхлэх →
            </button>
          </div>
        </div>
      )}

      {step === "viewing" && (
        <div style={feedsWrap}>
          {/* hidden camera canvas — status tracking */}
          <canvas ref={cameraCanvasRef} style={{ display: "none" }} />

          {/* Screen feed — full height */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px", minHeight: 0 }}>
            <p style={feedLabel}>ДЭЛГЭЦ</p>
            <div style={{ ...feedBox, flex: 1 }}>
              <canvas
                ref={screenCanvasRef}
                style={{ width: "100%", height: "100%", objectFit: "contain", display: screenOn ? "block" : "none" }}
              />
              {!screenOn && (
                <div style={feedPlaceholder}>
                  <span>Дэлгэц хуваалцаагүй байна</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function dotColor(s) {
  if (s === "live") return "#10b981";
  if (s === "connecting" || s === "waiting") return "#f59e0b";
  if (s === "offline" || s === "error") return "#ef4444";
  return "#9ca3af";
}

function statusText(s) {
  if (s === "live") return "● LIVE";
  if (s === "connecting") return "Холбогдож байна...";
  if (s === "waiting") return "Хүүхдийн камерийг хүлээж байна";
  if (s === "offline") return "Хүүхэд офлайн байна";
  if (s === "error") return "Алдаа";
  return "";
}

const pageWrap = { minHeight: "100dvh", background: "#f8faf9", display: "flex", flexDirection: "column", fontFamily: "inherit" };
const topBar = { display: "flex", alignItems: "center", gap: "12px", padding: "16px 24px", background: "#fff", borderBottom: "1px solid rgba(22,43,42,0.08)", position: "sticky", top: 0, zIndex: 10 };
const backBtn = { border: "none", background: "none", color: "#185d56", fontSize: "14px", cursor: "pointer", padding: "6px 0", fontWeight: 700, flexShrink: 0 };
const topTitle = { fontSize: "16px", fontWeight: 700, color: "#162b2a", flex: 1 };
const statusBadge = { display: "flex", alignItems: "center", gap: "6px" };
const statusDot = { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 };
const statusLabel = { fontSize: "13px", color: "#6d7d79" };
const inputWrap = { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 16px" };
const inputCard = { background: "#fff", borderRadius: "20px", padding: "40px 36px", boxShadow: "0 8px 40px rgba(0,0,0,0.08)", display: "flex", flexDirection: "column", alignItems: "center", gap: "28px", width: "100%", maxWidth: "420px" };
const inputTitle = { fontSize: "20px", fontWeight: 800, color: "#162b2a", margin: 0, textAlign: "center" };
const inputSubtitle = { fontSize: "14px", color: "#6d7d79", margin: "-20px 0 0", textAlign: "center" };
const digitRow = { display: "flex", gap: "10px", alignItems: "center" };
const digitInput = { width: "52px", height: "60px", borderRadius: "12px", border: "2px solid rgba(22,43,42,0.15)", fontSize: "26px", fontWeight: 700, textAlign: "center", color: "#162b2a", outline: "none", transition: "border-color 0.15s, background 0.15s", caretColor: "transparent" };
const actionBtn = { padding: "14px 40px", borderRadius: "12px", border: "none", background: "#185d56", color: "#fff", fontSize: "15px", fontWeight: 700, cursor: "pointer", transition: "opacity 0.15s" };
const feedsWrap = { flex: 1, display: "flex", flexDirection: "column", padding: "16px 24px", overflow: "hidden" };
const feedLabel = { fontSize: "11px", fontWeight: 700, letterSpacing: "1.5px", color: "#9ca3af", margin: 0 };
const feedBox = { width: "100%", background: "#0f0f0f", borderRadius: "14px", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" };
const feedPlaceholder = { color: "#4b5563", fontSize: "13px", textAlign: "center", padding: "20px" };
