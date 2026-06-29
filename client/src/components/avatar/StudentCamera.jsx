import { useEffect, useRef, useState, useCallback } from "react";

export function StudentCamera() {
  const videoRef = useRef(null);
  const [on, setOn] = useState(false);
  const [err, setErr] = useState(false);
  const mediaRecorderRef = useRef(null);
  const wsRef = useRef(null);

  const start = useCallback(async () => {
    setErr(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: "user" },
        audio: false,
      });
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setOn(true);

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      mediaRecorderRef.current = mediaRecorder;

      const chunks = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(e.data); // Send as binary
          }
        }
      };

      mediaRecorder.onstop = () => {
        // Send end signal
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'video-end' }));
          // Close the WebSocket after sending the end signal
          wsRef.current.close();
        }
      };

      mediaRecorder.start();

      // Set up WebSocket
      const ws = new WebSocket('ws://localhost:3000/ws');
      wsRef.current = ws;
      ws.onopen = () => console.log('WebSocket connected for video');
      ws.onerror = (error) => console.error('WebSocket error:', error);
      ws.onclose = () => {
        console.log('WebSocket disconnected');
        wsRef.current = null;
      };

    } catch (err) {
      setErr(true);
      console.error('Error accessing media devices.', err);
    }
  }, []);

  const stop = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    // Stop the video tracks
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setOn(false);
    setErr(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return (
    <div className="student-cam">
      <p className="student-cam-label">ХҮҮХДИЙН КАМЕР</p>

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
              <path d="M15 10l4.553-2.277A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
            </svg>
            {err ? (
              <span style={{ fontSize: 11, color: "#ef4444" }}>
                Камер нээгдсэнгүй
              </span>
            ) : (
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                Камер унтраалттай
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
        {on ? "■ Камер хаах" : "▶ Камер нээх"}
      </button>
    </div>
  );
}