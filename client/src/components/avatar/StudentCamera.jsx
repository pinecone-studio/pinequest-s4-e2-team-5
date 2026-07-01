import { useCallback, useEffect, useRef, useState } from "react";
import { API_BASE, WS_BASE } from "../../lib/config.js";

function getRecorderMimeType() {
  if (!window.MediaRecorder) return "";
  const types = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
    "video/mp4",
  ];
  return types.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

export function StudentCamera({ childId = "хүүхэд", sessionCode }) {
  const videoRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const recordStartedAtRef = useRef(0);
  const [on, setOn] = useState(false);
  const [err, setErr] = useState(false);
  const [recordStatus, setRecordStatus] = useState("idle");
  const streamWsRef = useRef(null);
  const streamCanvasRef = useRef(null);
  const streamIntervalRef = useRef(null);
  const screenStreamRef = useRef(null);
  const screenWsRef = useRef(null);
  const screenCanvasRef = useRef(null);
  const screenIntervalRef = useRef(null);

  const uploadRecording = useCallback(
    async (blob, durationMs) => {
      if (!blob.size) return;
      setRecordStatus("uploading");
      try {
        const response = await fetch(`${API_BASE}/api/recordings`, {
          method: "POST",
          headers: {
            "Content-Type": blob.type || "video/webm",
            "x-child-id": childId,
            "x-duration-ms": String(durationMs),
          },
          body: blob,
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "Recording upload failed");
        }

        setRecordStatus("saved");
      } catch (error) {
        console.error("Recording upload failed:", error);
        setRecordStatus("error");
      }
    },
    [childId],
  );

  const startRecording = useCallback(
    (stream) => {
      if (!window.MediaRecorder || recorderRef.current) return;

      const mimeType = getRecorderMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      chunksRef.current = [];
      recordStartedAtRef.current = Date.now();

      recorder.ondataavailable = (event) => {
        if (event.data?.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const durationMs = Date.now() - recordStartedAtRef.current;
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || mimeType || "video/webm",
        });
        chunksRef.current = [];
        recorderRef.current = null;
        uploadRecording(blob, durationMs);
      };

      recorder.start();
      recorderRef.current = recorder;
      setRecordStatus("recording");
    },
    [uploadRecording],
  );

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    setRecordStatus("stopping");
    recorder.stop();
  }, []);

  const start = useCallback(async () => {
    setErr(false);
    setRecordStatus("idle");
    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720, facingMode: "user" },
          audio: true,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720, facingMode: "user" },
          audio: false,
        });
      }

      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      startRecording(stream);
      setOn(true);

      if (sessionCode) {
        const ws = new WebSocket(`${WS_BASE}/ws?role=child&code=${sessionCode}`);
        streamWsRef.current = ws;
        const canvas = streamCanvasRef.current;
        const ctx = canvas.getContext("2d");
        streamIntervalRef.current = setInterval(() => {
          if (!ws || ws.readyState !== WebSocket.OPEN) return;
          canvas.width = 1280;
          canvas.height = 720;
          if (videoRef.current) ctx.drawImage(videoRef.current, 0, 0, 1280, 720);
          ws.send(JSON.stringify({ type: "camera", data: canvas.toDataURL("image/jpeg", 0.9) }));
        }, 150);
      }

      // Камертай зэрэг дэлгэц хуваалцалтыг автоматаар эхлүүлнэ
      if (sessionCode && navigator.mediaDevices?.getDisplayMedia) {
        try {
          const screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: { 
              displaySurface: "monitor", // Эсвэл "window" / "browser"
              frameRate: 5, 
              cursor: "always" 
            },
            audio: false,
            // Гогцоо үүсэхээс сэргийлэх нэмэлт тохиргоонууд:
            selfBrowserSurface: "exclude", // Одоогийн байгаа энэ таб-ыг жагсаалтаас хасна
            preferCurrentTab: false       // Одоогийн таб-ыг хуваалцахыг санал болгохгүй
          });
          
          screenStreamRef.current = screenStream;
          const sVideo = document.createElement("video");
          sVideo.srcObject = screenStream;
          sVideo.muted = true;
          await sVideo.play();

          const stopScreen = () => {
            clearInterval(screenIntervalRef.current);
            screenIntervalRef.current = null;
            screenStream.getTracks().forEach((t) => t.stop());
            screenStreamRef.current = null;
            screenWsRef.current?.close();
            screenWsRef.current = null;
          };
          screenStream.getVideoTracks()[0]?.addEventListener("ended", stopScreen);

          const sWs = new WebSocket(`${WS_BASE}/ws?role=screen&code=${sessionCode}`);
          screenWsRef.current = sWs;
          const sCanvas = screenCanvasRef.current;
          const sCtx = sCanvas.getContext("2d");
          screenIntervalRef.current = setInterval(() => {
            if (!sWs || sWs.readyState !== WebSocket.OPEN) return;
            if (!sVideo.videoWidth) return;
            const scale = Math.min(1, 1280 / sVideo.videoWidth);
            sCanvas.width = Math.round(sVideo.videoWidth * scale);
            sCanvas.height = Math.round(sVideo.videoHeight * scale);
            sCtx.drawImage(sVideo, 0, 0, sCanvas.width, sCanvas.height);
            sWs.send(JSON.stringify({ type: "screen", data: sCanvas.toDataURL("image/jpeg", 0.7) }));
          }, 500);
        } catch (error) {
          console.log("Screen share cancelled or failed:", error);
          // Хэрэглэгч цуцалсан — камер хэвээр ажиллана
        }
      }
    } catch (error) {
      setErr(true);
      setRecordStatus("idle");
      console.error("Error accessing media devices.", error);
    }
  }, [startRecording, sessionCode]);

  const stop = useCallback(() => {
    stopRecording();
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    clearInterval(streamIntervalRef.current);
    streamIntervalRef.current = null;
    streamWsRef.current?.close();
    streamWsRef.current = null;
    // Дэлгэц хуваалцалтыг зогсооно
    clearInterval(screenIntervalRef.current);
    screenIntervalRef.current = null;
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;
    screenWsRef.current?.close();
    screenWsRef.current = null;
    setOn(false);
  }, [stopRecording]);

  useEffect(() => () => stop(), [stop]);

  return (
    <div className="student-cam">
      <p className="student-cam-label">ХҮҮХДИЙН КАМЕР</p>

      <div className={`student-cam-wrap${on ? " is-live" : ""}`}>
        {on && (
          <span className="student-cam-rec">
            {recordStatus === "recording" ? "REC" : "LIVE"}
          </span>
        )}
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

      {recordStatus === "uploading" && (
        <p className="student-cam-status">Бичлэг хадгалж байна...</p>
      )}
      {recordStatus === "saved" && (
        <p className="student-cam-status is-ok">Бичлэг хадгалагдлаа</p>
      )}
      {recordStatus === "error" && (
        <p className="student-cam-status is-error">Бичлэг хадгалж чадсангүй</p>
      )}

      <canvas ref={streamCanvasRef} style={{ display: "none" }} />
      <canvas ref={screenCanvasRef} style={{ display: "none" }} />
    </div>
  );
}