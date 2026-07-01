import { useCallback, useEffect, useRef, useState } from "react";
import { WS_BASE } from "../lib/config.js";

export default function ParentModal({ onClose }) {
  const [step, setStep] = useState("input"); // 'input' | 'viewing'
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [status, setStatus] = useState("idle"); // 'idle'|'connecting'|'waiting'|'live'|'offline'|'error'
  const inputRefs = useRef([]);
  const wsRef = useRef(null);
  const cameraCanvasRef = useRef(null);
  const screenCanvasRef = useRef(null);
  const [screenOn, setScreenOn] = useState(false);

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
  };

  return (
    <div style={overlay}>
      <div style={{ ...modal, maxWidth: step === "viewing" ? "560px" : "480px" }}>
        <div style={header}>
          <span style={title}>{step === "input" ? "Эцэг эхийн хяналт" : `Код: ${code}`}</span>
          <button style={closeBtn} onClick={onClose} aria-label="Хаах">✕</button>
        </div>

        {step === "input" && (
          <div style={inputStep}>
            <p style={desc}>Хүүхдийн дэлгэцэн дээрх 6 оронтой кодыг оруулна уу</p>
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
                  style={{ ...digitInput, borderColor: d ? "#185d56" : "rgba(22,43,42,0.2)", background: d ? "#f0faf8" : "#fff" }}
                />
              ))}
            </div>
            <button
              style={{ ...actionBtn, opacity: code.length === 6 ? 1 : 0.45 }}
              disabled={code.length !== 6}
              onClick={connect}
            >
              Хянах эхлэх →
            </button>
          </div>
        )}

        {step === "viewing" && (
          <div style={viewStep}>
            <div style={statusBar}>
              <div style={{ ...statusDot, background: dotColor(status) }} />
              <span style={statusLabel}>{statusText(status)}</span>
              <button style={backBtn} onClick={goBack}>← Буцах</button>
            </div>
            <div style={feedSection}>
              <p style={feedLabel}>КАМЕР</p>
              <div style={feedBox}>
                <canvas
                  ref={cameraCanvasRef}
                  style={{ width: "100%", height: "100%", objectFit: "contain", display: status === "live" ? "block" : "none", transform: "scaleX(-1)" }}
                />
                {status !== "live" && (
                  <div style={feedPlaceholder}>
                    {status === "connecting" && <span>Холбогдож байна...</span>}
                    {status === "waiting" && <span>Хүүхдийн камерийг хүлээж байна</span>}
                    {status === "offline" && <span style={{ color: "#ef4444" }}>Хүүхэд офлайн байна</span>}
                    {status === "error" && <span style={{ color: "#ef4444" }}>Холболтын алдаа</span>}
                  </div>
                )}
              </div>
            </div>
            <div style={feedSection}>
              <p style={feedLabel}>ДЭЛГЭЦ</p>
              <div style={{ ...feedBox, aspectRatio: "16/9" }}>
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

const overlay = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" };
const modal = { background: "#fff", borderRadius: "18px", width: "100%", maxWidth: "480px", boxShadow: "0 24px 60px rgba(0,0,0,0.22)", overflow: "hidden", fontFamily: "inherit" };
const header = { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 16px", borderBottom: "1px solid rgba(22,43,42,0.08)" };
const title = { fontSize: "17px", fontWeight: 700, color: "#162b2a" };
const closeBtn = { width: 32, height: 32, borderRadius: "50%", border: "none", background: "rgba(22,43,42,0.07)", color: "#162b2a", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" };
const inputStep = { padding: "28px 24px 32px", display: "flex", flexDirection: "column", alignItems: "center", gap: "24px" };
const desc = { fontSize: "14px", color: "#6d7d79", textAlign: "center", margin: 0, lineHeight: 1.5 };
const digitRow = { display: "flex", gap: "10px", alignItems: "center" };
const digitInput = { width: "52px", height: "60px", borderRadius: "12px", border: "2px solid rgba(22,43,42,0.2)", fontSize: "26px", fontWeight: 700, textAlign: "center", color: "#162b2a", outline: "none", transition: "border-color 0.15s, background 0.15s", caretColor: "transparent" };
const actionBtn = { padding: "14px 36px", borderRadius: "12px", border: "none", background: "#185d56", color: "#fff", fontSize: "15px", fontWeight: 700, cursor: "pointer", transition: "opacity 0.15s" };
const viewStep = { padding: "16px 24px 24px", display: "flex", flexDirection: "column", gap: "14px" };
const statusBar = { display: "flex", alignItems: "center", gap: "8px" };
const statusDot = { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 };
const statusLabel = { fontSize: "13px", color: "#6d7d79", flex: 1 };
const backBtn = { border: "none", background: "none", color: "#185d56", fontSize: "13px", cursor: "pointer", padding: "4px 0", fontWeight: 600 };
const feedSection = { display: "flex", flexDirection: "column", gap: "8px" };
const feedLabel = { fontSize: "11px", fontWeight: 700, letterSpacing: "1px", color: "#9ca3af", margin: 0 };
const feedBox = { width: "100%", aspectRatio: "4/3", background: "#0f0f0f", borderRadius: "12px", overflow: "hidden", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" };
const feedPlaceholder = { color: "#4b5563", fontSize: "14px", textAlign: "center", padding: "16px" };
