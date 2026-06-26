import { useEffect, useRef, useState, useCallback } from "react";

export function StudentCamera() {
  const videoRef = useRef(null);
  const [on, setOn] = useState(false);
  const [err, setErr] = useState(false);

  const start = useCallback(async () => {
    setErr(false);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("getUserMedia дэмжигдэхгүй (HTTPS/localhost шаардлагатай)");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: "user" },
        audio: false,
      });
      const video = videoRef.current;
      if (!video) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      // Видео нь үргэлж DOM-д байх ба зөвхөн opacity-аар нуугддаг.
      // display:none үед зарим браузер кадр зураггүй / play() амжилтгүй болдог.
      setOn(true);
      video.srcObject = stream;
      video.muted = true;
      await video.play();
    } catch (e) {
      console.error("StudentCamera start failed:", e);
      setOn(false);
      setErr(true);
    }
  }, []);

  const stop = useCallback(() => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setOn(false);
  }, []);

  // Камерыг ачаалахад автоматаар асаахгүй — зөвшөөрөл өгөөгүй үед
  // ачаалах үед улаан алдаа гарахаас сэргийлнэ. Хэрэглэгч товчоор асаана.
  useEffect(() => () => stop(), [stop]);

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
          style={{ opacity: on ? 1 : 0 }}
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
