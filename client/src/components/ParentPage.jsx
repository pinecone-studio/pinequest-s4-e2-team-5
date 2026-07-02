import { useCallback, useEffect, useRef, useState } from "react";
import { API_BASE, WS_BASE, ICE_SERVERS } from "../lib/config.js";

function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleString("mn-MN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtDuration(ms) {
  if (!ms) return "";
  const s = Math.round(ms / 1000);
  const m = Math.floor(s / 60),
    rem = s % 60;
  return m > 0 ? `${m}м ${rem}с` : `${rem}с`;
}

export default function ParentPage({ onBack }) {
  const [step, setStep] = useState("input");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("idle");
  const [screenOn, setScreenOn] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [recordings, setRecordings] = useState([]);
  const [playingId, setPlayingId] = useState(null);
  const wsRef = useRef(null);
  const cameraVideoRef = useRef(null);
  const screenVideoRef = useRef(null);
  const cameraPcRef = useRef(null);
  const screenPcRef = useRef(null);
  const pendingCameraCandidatesRef = useRef([]);
  const pendingScreenCandidatesRef = useRef([]);
  // Video элемент нь бичлэг тоглуулж байх үед DOM-оос салдаг тул MediaStream-ийг
  // тусад нь хадгалж, дахин mount хийгдэх үед srcObject-д буцааж холбоно.
  const cameraStreamRef = useRef(null);
  const screenStreamRef = useRef(null);

  const fetchRecordings = useCallback((fc) => {
    if (!fc) return;
    fetch(`${API_BASE}/api/recordings?family=${encodeURIComponent(fc)}`)
      .then((r) => r.json())
      .then((d) => setRecordings(d.recordings ?? []))
      .catch(() => {});
  }, []);

  // Бичлэг тоглуулж байх үед screen video элемент DOM-оос салж дахин mount
  // хийгддэг тул амьд stream-ийг буцааж холбоно.
  useEffect(() => {
    if (!playingId && screenVideoRef.current && screenStreamRef.current) {
      screenVideoRef.current.srcObject = screenStreamRef.current;
    }
  }, [playingId]);

  const closePeerConnections = useCallback(() => {
    cameraPcRef.current?.close();
    cameraPcRef.current = null;
    screenPcRef.current?.close();
    screenPcRef.current = null;
    pendingCameraCandidatesRef.current = [];
    pendingScreenCandidatesRef.current = [];
    cameraStreamRef.current = null;
    screenStreamRef.current = null;
    if (cameraVideoRef.current) cameraVideoRef.current.srcObject = null;
    if (screenVideoRef.current) screenVideoRef.current.srcObject = null;
    setScreenOn(false);
  }, []);

  const handleOffer = useCallback(async (ws, msg) => {
    const isScreen = msg.kind === "screen";
    const pcRef = isScreen ? screenPcRef : cameraPcRef;
    const videoRef = isScreen ? screenVideoRef : cameraVideoRef;
    const streamRef = isScreen ? screenStreamRef : cameraStreamRef;
    const pendingRef = isScreen ? pendingScreenCandidatesRef : pendingCameraCandidatesRef;

    pcRef.current?.close();
    pendingRef.current = [];
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcRef.current = pc;

    pc.ontrack = (e) => {
      const stream = e.streams[0];
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      if (isScreen) setScreenOn(true);
      else setStatus("live");
    };
    pc.onicecandidate = (e) => {
      if (e.candidate && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "ice-candidate", kind: msg.kind, candidate: e.candidate }));
      }
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed") setStatus("error");
    };

    try {
      await pc.setRemoteDescription(msg.sdp);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "answer", kind: msg.kind, sdp: answer }));
      }
      pendingRef.current.splice(0).forEach((c) => pc.addIceCandidate(c).catch(() => {}));
    } catch {
      /* offer/answer солилцоо амжилтгүй болов */
    }
  }, []);

  const connect = useCallback(() => {
    if (code.length < 4) return;
    setStep("viewing");
    setStatus("connecting");
    fetchRecordings(code);
  }, [code, fetchRecordings]);

  useEffect(() => {
    if (step !== "viewing") return;
    const ws = new WebSocket(`${WS_BASE}/ws?role=parent&code=${code}`);
    wsRef.current = ws;

    ws.onopen = () => setStatus("waiting");

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === "child-disconnected") {
          closePeerConnections();
          setStatus("offline");
          setTimeout(() => fetchRecordings(code), 3000);
          return;
        }
        if (msg.type === "screen-ended") {
          screenPcRef.current?.close();
          screenPcRef.current = null;
          pendingScreenCandidatesRef.current = [];
          screenStreamRef.current = null;
          if (screenVideoRef.current) screenVideoRef.current.srcObject = null;
          setScreenOn(false);
          return;
        }
        if (msg.type === "family-code" && msg.code) {
          fetchRecordings(msg.code);
          return;
        }
        if (msg.type === "offer" && msg.kind) {
          handleOffer(ws, msg);
          return;
        }
        if (msg.type === "ice-candidate" && msg.kind) {
          const isScreen = msg.kind === "screen";
          const pc = (isScreen ? screenPcRef : cameraPcRef).current;
          const pendingRef = isScreen ? pendingScreenCandidatesRef : pendingCameraCandidatesRef;
          if (pc?.remoteDescription) {
            pc.addIceCandidate(msg.candidate).catch(() => {});
          } else {
            pendingRef.current.push(msg.candidate);
          }
        }
      } catch {
        /* буруу форматтай мессежийг үл тоомсорлоно */
      }
    };

    ws.onclose = () => setStatus((s) => (s === "offline" ? s : "idle"));
    ws.onerror = () => setStatus("error");

    return () => {
      ws.close();
      wsRef.current = null;
      closePeerConnections();
    };
  }, [step, code, fetchRecordings, handleOffer, closePeerConnections]);

  const goBack = () => {
    wsRef.current?.close();
    closePeerConnections();
    setStep("input");
    setStatus("idle");
    setScreenOn(false);
    setPlayingId(null);
    setRecordings([]);
    onBack();
  };

  return (
    <div style={pageWrap}>
      <div style={topBar}>
        <button style={backBtn} onClick={goBack}>
          ← Буцах
        </button>
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
            <p style={inputSubtitle}>Кодыг оруулна уу (жш: WBOWAC)</p>
            <input
              type="text"
              value={code}
              onChange={(e) =>
                setCode(
                  e.target.value
                    .toUpperCase()
                    .replace(/[^A-Z0-9]/g, "")
                    .slice(0, 8),
                )
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" && code.length >= 4) connect();
              }}
              placeholder="XXXXXX"
              maxLength={8}
              autoFocus
              style={codeInput}
            />
            <button
              style={{ ...actionBtn, opacity: code.length >= 4 ? 1 : 0.4 }}
              disabled={code.length < 4}
              onClick={connect}
            >
              Хянах эхлэх →
            </button>
          </div>
        </div>
      )}

      {step === "viewing" && (
        <div style={viewingWrap}>
          {/* Sidebar */}
          <div style={{ ...sidebar, width: sidebarOpen ? "260px" : "44px" }}>
            <button
              style={sidebarToggle}
              onClick={() => setSidebarOpen((o) => !o)}
              title={sidebarOpen ? "Хаах" : "Нээх"}
            >
              {sidebarOpen ? "◀" : "▶"}
            </button>
            {sidebarOpen && (
              <>
                <p style={sidebarTitle}>Бичлэгийн түүх</p>
                <button
                  style={refreshBtn}
                  onClick={() => fetchRecordings(code)}
                >
                  ↻ Шинэчлэх
                </button>
                <div style={recList}>
                  {recordings.length === 0 && (
                    <p style={recEmpty}>Бичлэг байхгүй байна</p>
                  )}
                  {recordings.map((r) => (
                    <button
                      key={r.id}
                      style={{
                        ...recItem,
                        background:
                          playingId === r.id ? "#e8f5f0" : "transparent",
                        borderColor:
                          playingId === r.id
                            ? "#185d56"
                            : "rgba(22,43,42,0.08)",
                      }}
                      onClick={() =>
                        setPlayingId(playingId === r.id ? null : r.id)
                      }
                    >
                      <span style={recDate}>{fmtDate(r.created_at)}</span>
                      {r.duration_ms > 0 && (
                        <span style={recDur}>{fmtDuration(r.duration_ms)}</span>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Main feed area */}
          <div style={mainArea}>
            <video ref={cameraVideoRef} autoPlay playsInline muted style={{ display: "none" }} />

            {playingId ? (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  minHeight: 0,
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <p style={feedLabel}>БИЧЛЭГ</p>
                  <button
                    style={closePlayBtn}
                    onClick={() => setPlayingId(null)}
                  >
                    ✕ Хаах
                  </button>
                </div>
                <div style={{ ...feedBox, flex: 1 }}>
                  <video
                    key={playingId}
                    src={`${API_BASE}/api/recordings/stream?path=${encodeURIComponent(playingId)}`}
                    controls
                    autoPlay
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      background: "#000",
                    }}
                  />
                </div>
              </div>
            ) : (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  minHeight: 0,
                }}
              >
                <p style={feedLabel}>ДЭЛГЭЦ</p>
                <div style={{ ...feedBox, flex: 1 }}>
                  <video
                    ref={screenVideoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      display: screenOn ? "block" : "none",
                    }}
                  />
                  {!screenOn && (
                    <div style={feedPlaceholder}>
                      <span>Дэлгэц хуваалцаагүй байна</span>
                    </div>
                  )}
                </div>
              </div>
            )}
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

const pageWrap = {
  minHeight: "100dvh",
  background: "#f7f5ee",
  display: "flex",
  flexDirection: "column",
  fontFamily: "inherit",
};
const topBar = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "16px 24px",
  background: "#fff",
  borderBottom: "1px solid rgba(22,43,42,0.08)",
  position: "sticky",
  top: 0,
  zIndex: 10,
};
const backBtn = {
  border: "none",
  background: "none",
  color: "#185d56",
  fontSize: "14px",
  cursor: "pointer",
  padding: "6px 0",
  fontWeight: 700,
  flexShrink: 0,
};
const topTitle = {
  fontSize: "16px",
  fontWeight: 700,
  color: "#162b2a",
  fontFamily: "'Rubik', 'Manrope', sans-serif",
  flex: 1,
};
const statusBadge = { display: "flex", alignItems: "center", gap: "6px" };
const statusDot = { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 };
const statusLabel = { fontSize: "13px", color: "#6d7d79" };
const inputWrap = {
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "32px 16px",
};
const inputCard = {
  background: "#fff",
  borderRadius: "20px",
  padding: "40px 36px",
  boxShadow: "0 8px 40px rgba(22,43,42,0.10)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "24px",
  width: "100%",
  maxWidth: "400px",
};
const inputTitle = {
  fontSize: "20px",
  fontWeight: 800,
  color: "#162b2a",
  fontFamily: "'Rubik', 'Manrope', sans-serif",
  margin: 0,
  textAlign: "center",
};
const inputSubtitle = {
  fontSize: "14px",
  color: "#6d7d79",
  margin: "-16px 0 0",
  textAlign: "center",
};
const codeInput = {
  width: "100%",
  padding: "16px 20px",
  borderRadius: "14px",
  border: "2px solid rgba(22,43,42,0.15)",
  fontSize: "28px",
  fontWeight: 800,
  textAlign: "center",
  color: "#162b2a",
  letterSpacing: "6px",
  outline: "none",
  background: "#fff",
  boxSizing: "border-box",
};
const actionBtn = {
  padding: "14px 40px",
  borderRadius: "12px",
  border: "none",
  background: "#185d56",
  color: "#fff",
  fontSize: "15px",
  fontWeight: 700,
  cursor: "pointer",
  transition: "opacity 0.15s",
};
const viewingWrap = {
  flex: 1,
  display: "flex",
  flexDirection: "row",
  overflow: "hidden",
};
const sidebar = {
  display: "flex",
  flexDirection: "column",
  background: "#fff",
  borderRight: "1px solid rgba(22,43,42,0.08)",
  transition: "width 0.2s",
  overflow: "hidden",
  flexShrink: 0,
};
const sidebarToggle = {
  margin: "10px auto",
  display: "block",
  border: "none",
  background: "none",
  color: "#185d56",
  fontSize: "13px",
  cursor: "pointer",
  padding: "4px 8px",
  fontWeight: 700,
  flexShrink: 0,
};
const sidebarTitle = {
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "1.5px",
  color: "#9ca3af",
  fontFamily: "'Rubik', 'Manrope', sans-serif",
  margin: "0 0 2px",
  padding: "0 14px",
};
const refreshBtn = {
  display: "block",
  margin: "0 14px 8px",
  border: "none",
  background: "none",
  color: "#185d56",
  fontSize: "11px",
  fontWeight: 700,
  cursor: "pointer",
  padding: "2px 0",
  textAlign: "left",
};
const recList = {
  flex: 1,
  overflowY: "auto",
  padding: "0 8px 12px",
  display: "flex",
  flexDirection: "column",
  gap: "4px",
};
const recEmpty = {
  fontSize: "12px",
  color: "#9ca3af",
  textAlign: "center",
  padding: "20px 8px",
};
const recItem = {
  width: "100%",
  border: "1px solid rgba(22,43,42,0.08)",
  borderRadius: "10px",
  padding: "10px 12px",
  cursor: "pointer",
  textAlign: "left",
  display: "flex",
  flexDirection: "column",
  gap: "2px",
  transition: "background 0.1s",
};
const recDate = { fontSize: "12px", fontWeight: 600, color: "#162b2a" };
const recDur = { fontSize: "11px", color: "#6d7d79" };
const mainArea = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  padding: "16px",
  overflow: "hidden",
  gap: "8px",
};
const feedLabel = {
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "1.5px",
  color: "#9ca3af",
  fontFamily: "'Rubik', 'Manrope', sans-serif",
  margin: 0,
};
const feedBox = {
  width: "100%",
  background: "#0f0f0f",
  borderRadius: "14px",
  overflow: "hidden",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
const feedPlaceholder = {
  color: "#4b5563",
  fontSize: "13px",
  textAlign: "center",
  padding: "20px",
};
const closePlayBtn = {
  fontSize: "11px",
  fontWeight: 700,
  color: "#185d56",
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: "2px 6px",
};
