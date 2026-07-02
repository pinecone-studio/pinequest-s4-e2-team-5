import { useCallback, useEffect, useRef, useState } from "react";
import { API_BASE, WS_BASE, ICE_SERVERS } from "../../lib/config.js";

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
  // WebRTC: signaling socket + one { cameraPc, screenPc } pair per watching parent.
  const signalingWsRef = useRef(null);
  const peersRef = useRef(new Map());
  const cameraStreamRef = useRef(null);
  const screenStreamRef = useRef(null);

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

  const getPeerEntry = (parentId) => {
    let entry = peersRef.current.get(parentId);
    if (!entry) {
      entry = {
        cameraPc: null,
        screenPc: null,
        pendingCameraCandidates: [],
        pendingScreenCandidates: [],
      };
      peersRef.current.set(parentId, entry);
    }
    return entry;
  };

  // sender.setParameters()-ийг аюулгүй дуудах туслах функц — дэмждэггүй
  // орчинд чимээгүй унана (encoding параметрүүд тохируулагдахгүй л үлдэнэ).
  const applyEncodingParams = (sender, { encoding, degradationPreference }) => {
    try {
      const params = sender.getParameters();
      if (!params.encodings || params.encodings.length === 0) {
        params.encodings = [{}];
      }
      Object.assign(params.encodings[0], encoding);
      if (degradationPreference) params.degradationPreference = degradationPreference;
      sender.setParameters(params).catch(() => {});
    } catch {
      // setParameters unsupported / sender not ready — non-fatal
    }
  };

  // Тухайн эцэг эхэд (parentId) камер эсвэл дэлгэцийн RTCPeerConnection нээж,
  // offer илгээнэ. Хоёр төрөл тус бүрдээ өөр PeerConnection ашигладаг тул
  // дэлгэц хуваалцалт хожуу эхэлсэн ч renegotiation хэрэггүй — зүгээр шинэ
  // PeerConnection нээгээд ердийн offer/answer хийнэ.
  const openPeerConnection = (parentId, kind) => {
    const stream =
      kind === "screen" ? screenStreamRef.current : cameraStreamRef.current;
    if (!stream) return;
    const entry = getPeerEntry(parentId);
    const pcKey = kind === "screen" ? "screenPc" : "cameraPc";
    if (entry[pcKey]) return;

    const pc = new RTCPeerConnection({
      iceServers: ICE_SERVERS,
      iceCandidatePoolSize: 1,
    });

    // Эцэг эхийн камерын <video> нь display:none + muted бөгөөд өөр хэн ч
    // сонсдоггүй тул камерын аудио трек нь дэлгэц хуваалцалттай хуваалцдаг
    // uplink-ийг дэмий эзэлж байсан — огт илгээхгүй.
    const tracksToSend =
      kind === "camera"
        ? stream.getTracks().filter((track) => track.kind !== "audio")
        : stream.getTracks();

    tracksToSend.forEach((track) => {
      const sender = pc.addTrack(track, stream);
      if (kind === "camera" && track.kind === "video") {
        applyEncodingParams(sender, {
          encoding: { maxBitrate: 250_000, scaleResolutionDownBy: 2 },
        });
      }
      if (kind === "screen" && track.kind === "video") {
        // Дэлгэц хуваалцалт: bandwidth хумигдвал резолюц буурч болно,
        // харин frame rate тогтвортой хэвээр байх ёстой — эцэг эх
        // "live" мэдрэмжийг алдахгүй байхын тулд.
        applyEncodingParams(sender, {
          encoding: { maxBitrate: 4_000_000 },
          degradationPreference: "maintain-framerate",
        });
      }
    });
    pc.onicecandidate = (e) => {
      if (e.candidate && signalingWsRef.current?.readyState === WebSocket.OPEN) {
        signalingWsRef.current.send(
          JSON.stringify({
            type: "ice-candidate",
            target: parentId,
            kind,
            candidate: e.candidate,
          }),
        );
      }
    };
    entry[pcKey] = pc;

    pc.createOffer()
      .then((offer) => pc.setLocalDescription(offer).then(() => offer))
      .then((offer) => {
        signalingWsRef.current?.send(
          JSON.stringify({ type: "offer", target: parentId, kind, sdp: offer }),
        );
      })
      .catch(() => {});
  };

  const closePeerPair = (parentId) => {
    const entry = peersRef.current.get(parentId);
    if (!entry) return;
    entry.cameraPc?.close();
    entry.screenPc?.close();
    peersRef.current.delete(parentId);
  };

  const closeAllScreenPeers = () => {
    for (const entry of peersRef.current.values()) {
      entry.screenPc?.close();
      entry.screenPc = null;
      entry.pendingScreenCandidates = [];
    }
  };

  const closeAllPeers = () => {
    for (const parentId of Array.from(peersRef.current.keys())) closePeerPair(parentId);
  };

  const handleSignalingMessage = useCallback((e) => {
    let msg;
    try {
      msg = JSON.parse(e.data);
    } catch {
      return;
    }
    if (msg.type === "parent-joined") {
      openPeerConnection(msg.parentId, "camera");
      if (screenStreamRef.current) openPeerConnection(msg.parentId, "screen");
      return;
    }
    if (msg.type === "parent-left") {
      closePeerPair(msg.parentId);
      return;
    }
    if (msg.type === "answer" && msg.from) {
      const entry = peersRef.current.get(msg.from);
      const pc = msg.kind === "screen" ? entry?.screenPc : entry?.cameraPc;
      if (!pc) return;
      pc.setRemoteDescription(msg.sdp).then(() => {
        const pending =
          msg.kind === "screen"
            ? entry.pendingScreenCandidates
            : entry.pendingCameraCandidates;
        pending.splice(0).forEach((c) => pc.addIceCandidate(c).catch(() => {}));
      });
      return;
    }
    if (msg.type === "ice-candidate" && msg.from) {
      const entry = peersRef.current.get(msg.from);
      if (!entry) return;
      const pc = msg.kind === "screen" ? entry.screenPc : entry.cameraPc;
      if (pc?.remoteDescription) {
        pc.addIceCandidate(msg.candidate).catch(() => {});
      } else {
        const pending =
          msg.kind === "screen"
            ? entry.pendingScreenCandidates
            : entry.pendingCameraCandidates;
        pending.push(msg.candidate);
      }
    }
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
      cameraStreamRef.current = stream;

      if (sessionCode) {
        const ws = new WebSocket(`${WS_BASE}/ws?role=child&code=${sessionCode}&family=${encodeURIComponent(childId)}`);
        signalingWsRef.current = ws;
        ws.onmessage = handleSignalingMessage;
      }

      // Камертай зэрэг дэлгэц хуваалцалтыг автоматаар эхлүүлнэ
      if (sessionCode && navigator.mediaDevices?.getDisplayMedia) {
        try {
          const screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: { displaySurface: "window", frameRate: { ideal: 30 }, cursor: "always" },
            audio: false,
          });

          screenStreamRef.current = screenStream;

          const [screenVideoTrack] = screenStream.getVideoTracks();
          if (screenVideoTrack) screenVideoTrack.contentHint = "motion";

          const stopScreen = () => {
            screenStream.getTracks().forEach((t) => t.stop());
            screenStreamRef.current = null;
            closeAllScreenPeers();
            if (signalingWsRef.current?.readyState === WebSocket.OPEN) {
              signalingWsRef.current.send(JSON.stringify({ type: "screen-ended" }));
            }
          };
          screenStream.getVideoTracks()[0]?.addEventListener("ended", stopScreen);

          // Аль хэдийн холбогдсон эцэг эх бүрт дэлгэцийн шинэ PeerConnection нээнэ
          for (const parentId of peersRef.current.keys()) openPeerConnection(parentId, "screen");
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
  }, [startRecording, sessionCode, handleSignalingMessage]);

  const stop = useCallback(() => {
    stopRecording();
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    cameraStreamRef.current = null;
    closeAllPeers();
    signalingWsRef.current?.close();
    signalingWsRef.current = null;
    // Дэлгэц хуваалцалтыг зогсооно
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;
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
    </div>
  );
}