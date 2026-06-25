import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../../lib/api.js";
import { VAD, blobToBase64 } from "./voice.js";

// Хөнгөн дуу оролт: хүүхэд нэг өгүүлбэр хэлэхэд таниад onResult(text) дуудна.
// /start интро хуудсанд нэрийг дуугаар авахад ашиглана.
export function useVoiceCapture({ onResult }) {
  const [listening, setListening] = useState(false);

  const streamRef = useRef(null);
  const vadRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const mimeRef = useRef("audio/webm");
  const pausedRef = useRef(false); // робот ярьж байх үед түр зогсооно
  const busyRef = useRef(false); // STT боловсруулж байх үед
  const onResultRef = useRef(onResult);
  useEffect(() => {
    onResultRef.current = onResult;
  });

  const processAudio = useCallback(async (chunks, mime) => {
    if (busyRef.current || pausedRef.current) return;
    busyRef.current = true;
    try {
      const blob = new Blob(chunks, { type: mime });
      const base64 = await blobToBase64(blob);
      const { text } = await api.stt(base64, mime);
      if (text?.trim()) onResultRef.current?.(text.trim());
    } catch (e) {
      console.error("Voice capture STT алдаа:", e);
    } finally {
      busyRef.current = false;
    }
  }, []);

  const start = useCallback(async () => {
    if (streamRef.current) return;

    let mimeType = "audio/webm;codecs=opus";
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";
    }
    mimeRef.current = mimeType;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;

      vadRef.current = new VAD(stream, {
        threshold: 0.015,
        silenceMs: 1200,
        onSpeechStart: () => {
          if (pausedRef.current || busyRef.current) return; // робот ярьж/боловсруулж байна
          if (recorderRef.current) return; // аль хэдийн бичиж байна

          chunksRef.current = [];
          try {
            const recorder = new MediaRecorder(stream, { mimeType });
            recorder.ondataavailable = (e) => {
              if (e.data.size > 0) chunksRef.current.push(e.data);
            };
            recorder.start();
            recorderRef.current = recorder;
            setListening(true);
          } catch (e) {
            console.error("Recorder start error:", e);
          }
        },
        onSpeechEnd: () => {
          const recorder = recorderRef.current;
          if (!recorder || recorder.state === "inactive") {
            setListening(false);
            return;
          }
          recorderRef.current = null;
          setListening(false);
          const mime = mimeRef.current;
          recorder.onstop = () => {
            const captured = [...chunksRef.current];
            if (captured.length) processAudio(captured, mime);
          };
          try {
            recorder.stop();
          } catch (e) {
            console.error(e);
          }
        },
      });
    } catch (e) {
      console.error("Микрофон зөвшөөрөл олдсонгүй:", e);
    }
  }, [processAudio]);

  const pause = useCallback(() => {
    pausedRef.current = true;
  }, []);

  const resume = useCallback(() => {
    pausedRef.current = false;
  }, []);

  const stop = useCallback(() => {
    vadRef.current?.destroy();
    vadRef.current = null;
    if (recorderRef.current) {
      try {
        recorderRef.current.stop();
      } catch {
        /* аль хэдийн зогссон бол алгасна */
      }
      recorderRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setListening(false);
  }, []);

  return { listening, start, pause, resume, stop };
}
