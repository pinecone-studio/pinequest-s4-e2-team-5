import { useEffect, useRef, useState, useCallback } from "react";

export default function Camera() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const wsRef = useRef(null);
  const intervalRef = useRef(null);

  const [wsStatus, setWsStatus] = useState("idle");
  const [cameraOn, setCameraOn] = useState(false);
  const [fps, setFps] = useState(0);

  const connectWS = useCallback(() => {
    setWsStatus("connecting");
    const ws = new WebSocket("ws://localhost:3000/ws");
    wsRef.current = ws;

    ws.onopen = () => setWsStatus("connected");
    ws.onclose = () => setWsStatus("idle");
    ws.onerror = () => setWsStatus("error");

    return ws;
  }, []);

  const stopCamera = useCallback(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setCameraOn(false);
    setFps(0);
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false,
      });
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setCameraOn(true);

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      let frameCount = 0;
      let lastTick = Date.now();

      intervalRef.current = setInterval(() => {
        const ws = wsRef.current;
        if (!ws || ws.readyState !== WebSocket.OPEN) return;

        canvas.width = 320;
        canvas.height = 240;
        ctx.drawImage(videoRef.current, 0, 0, 320, 240);
        const frame = canvas.toDataURL("image/jpeg", 0.6);
        ws.send(JSON.stringify({ type: "frame", data: frame }));

        frameCount++;
        const now = Date.now();
        if (now - lastTick >= 1000) {
          setFps(frameCount);
          frameCount = 0;
          lastTick = now;
        }
      }, 100);
    } catch {
      setWsStatus("error");
    }
  }, []);

  useEffect(() => {
    const ws = connectWS();
    return () => {
      stopCamera();
      ws.close();
    };
  }, [connectWS, stopCamera]);

  const dot = {
    idle: "#6b7280",
    connecting: "#f59e0b",
    connected: "#10b981",
    error: "#ef4444",
  };

  const label = {
    idle: "Холбоогүй",
    connecting: "Холбогдож байна...",
    connected: "Холбогдсон",
    error: "Алдаа гарлаа",
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
      }}
    >
      <div
        style={{
          position: "relative",
          width: 640,
          height: 480,
          borderRadius: 16,
          overflow: "hidden",
          background: "#0f0f0f",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        }}
      >
        <video
          ref={videoRef}
          muted
          playsInline
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: "scaleX(-1)", // mirror
            display: cameraOn ? "block" : "none",
          }}
        />

        {!cameraOn && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              color: "#4b5563",
            }}
          >
            <svg
              width="72"
              height="72"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
            >
              <path d="M15 10l4.553-2.277A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
            </svg>
            <span style={{ fontSize: 15 }}>Камер идэвхгүй байна</span>
          </div>
        )}

        <div
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            background: "rgba(0,0,0,0.65)",
            borderRadius: 20,
            padding: "4px 12px",
            display: "flex",
            alignItems: "center",
            gap: 6,
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: dot[wsStatus],
              boxShadow: `0 0 6px ${dot[wsStatus]}`,
            }}
          />
          <span style={{ color: "#fff", fontSize: 12 }}>{label[wsStatus]}</span>
        </div>

        {cameraOn && (
          <div
            style={{
              position: "absolute",
              top: 12,
              left: 12,
              background: "rgba(0,0,0,0.65)",
              borderRadius: 20,
              padding: "4px 10px",
              backdropFilter: "blur(4px)",
            }}
          >
            <span
              style={{
                color: "#10b981",
                fontSize: 12,
                fontFamily: "monospace",
              }}
            >
              {fps} FPS
            </span>
          </div>
        )}

        {cameraOn && wsStatus === "connected" && (
          <div
            style={{
              position: "absolute",
              bottom: 12,
              left: 12,
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(0,0,0,0.65)",
              borderRadius: 20,
              padding: "4px 12px",
              backdropFilter: "blur(4px)",
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#ef4444",
                animation: "pulse 1.2s infinite",
              }}
            />
            <span style={{ color: "#fff", fontSize: 12 }}>Дамжуулж байна</span>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} style={{ display: "none" }} />

      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={cameraOn ? stopCamera : startCamera}
          style={{
            padding: "10px 28px",
            borderRadius: 10,
            border: "none",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 14,
            color: "#fff",
            background: cameraOn ? "#ef4444" : "#10b981",
            transition: "transform 0.1s, opacity 0.2s",
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          {cameraOn ? "⏹ Зогсоох" : "▶ Камер эхлүүлэх"}
        </button>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
