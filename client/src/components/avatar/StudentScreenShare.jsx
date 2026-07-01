import { useCallback, useEffect, useRef, useState } from "react";
import { WS_BASE } from "../../lib/config.js";

const MAX_WIDTH = 960;

export function StudentScreenShare({ sessionCode }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const wsRef = useRef(null);
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);
  const [on, setOn] = useState(false);
  const [err, setErr] = useState("");

  const stop = useCallback(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    wsRef.current?.close();
    wsRef.current = null;
    setOn(false);
  }, []);

  const start = useCallback(async () => {
    setErr("");
    if (!navigator.mediaDevices?.getDisplayMedia) {
      setErr("Энэ төхөөрөмж дэлгэц хуваалцахыг дэмжихгүй байна");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 5 },
        audio: false,
      });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setOn(true);

      // Browser-ийн "Stop sharing" товч дарвал зогсооно
      stream.getVideoTracks()[0]?.addEventListener("ended", stop);

      if (sessionCode) {
        const ws = new WebSocket(`${WS_BASE}/ws?role=screen&code=${sessionCode}`);
        wsRef.current = ws;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        intervalRef.current = setInterval(() => {
          if (!ws || ws.readyState !== WebSocket.OPEN) return;
          const video = videoRef.current;
          if (!video || !video.videoWidth) return;
          const scale = Math.min(1, MAX_WIDTH / video.videoWidth);
          canvas.width = Math.round(video.videoWidth * scale);
          canvas.height = Math.round(video.videoHeight * scale);
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          ws.send(JSON.stringify({ type: "screen", data: canvas.toDataURL("image/jpeg", 0.6) }));
        }, 500);
      }
    } catch (error) {
      // Хэрэглэгч цуцалсан эсвэл зөвшөөрөл өгөөгүй
      setErr("Дэлгэц хуваалцах эхлээгүй");
      stop();
      console.error("Error sharing screen.", error);
    }
  }, [sessionCode, stop]);

  useEffect(() => () => stop(), [stop]);

  return (
    <div className="student-cam">
      <p className="student-cam-label">ХҮҮХДИЙН ДЭЛГЭЦ</p>

      <div className={`student-cam-wrap${on ? " is-live" : ""}`}>
        {on && <span className="student-cam-rec">LIVE</span>}
        <video
          ref={videoRef}
          muted
          playsInline
          className="student-cam-video"
          style={{ display: on ? "block" : "none" }}
        />
        {!on && (
          <div className="student-cam-placeholder">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M3 5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5z" />
              <path d="M8 21h8M12 17v4" />
            </svg>
            {err ? (
              <span style={{ fontSize: 11, color: "#ef4444" }}>{err}</span>
            ) : (
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                Дэлгэц хуваалцаагүй
              </span>
            )}
          </div>
        )}
      </div>

      <button
        type="button"
        className="student-cam-btn"
        onClick={on ? stop : start}
      >
        {on ? "■ Хуваалцахаа болих" : "▶ Дэлгэц хуваалцах"}
      </button>

      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
}
