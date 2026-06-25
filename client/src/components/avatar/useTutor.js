import { useState, useCallback, useRef, useEffect } from "react";
import { api } from "../../lib/api.js";
import { API_BASE } from "../../lib/config.js";
import { VAD, blobToBase64 } from "./voice.js";

export function useTutor({ nickname, homeworkContext, interpretCommand }) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState(null);
  const [lastText, setLastText] = useState("");

  const messagesRef = useRef([]);
  const nicknameRef = useRef(nickname);
  const homeworkRef = useRef(homeworkContext);
  const isBusyRef = useRef(false);
  const sessionIdRef = useRef(null);
  const analysisRef = useRef(null);
  const interpretCommandRef = useRef(interpretCommand);

  const streamRef = useRef(null);
  const vadRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const mimeTypeRef = useRef("audio/webm");

  // Яриа давхцахаас сэргийлэх: нэг л аудио тоглоно, шинэ яриа хуучныг таслана.
  const currentAudioRef = useRef(null);
  const currentUrlRef = useRef("");
  const audioResolveRef = useRef(null);
  const speakSeqRef = useRef(0);

  const stopCurrentAudio = useCallback(() => {
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
      } catch {
        /* аль хэдийн зогссон бол алгасна */
      }
      currentAudioRef.current.onended = null;
      currentAudioRef.current.onerror = null;
      currentAudioRef.current = null;
    }
    if (currentUrlRef.current) {
      URL.revokeObjectURL(currentUrlRef.current);
      currentUrlRef.current = "";
    }
    // Хуучин speak-ийн await-ийг гацалгүй чөлөөлнө
    if (audioResolveRef.current) {
      const resolve = audioResolveRef.current;
      audioResolveRef.current = null;
      resolve();
    }
  }, []);

  useEffect(() => {
    nicknameRef.current = nickname;
  }, [nickname]);
  useEffect(() => {
    interpretCommandRef.current = interpretCommand;
  }, [interpretCommand]);
  useEffect(() => {
    homeworkRef.current = homeworkContext;
    // Homework орж ирэхэд analyze хийж session үүсгэнэ
    if (homeworkContext && !sessionIdRef.current) {
      api.analyzeProblem(homeworkContext)
        .then((analysis) => {
          analysisRef.current = analysis;
          return api.createSession({
            childId: nickname || "guest",
            problem: homeworkContext,
            skill: analysis.skill ?? "general",
            difficulty: analysis.difficulty ?? "easy",
            correctAnswer: analysis.correctAnswer ?? 0,
          });
        })
        .then((d) => { sessionIdRef.current = d.sessionId; })
        .catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [homeworkContext]);

  const speak = useCallback(async (text) => {
    if (!text) return;
    // Шинэ яриа эхэллээ — өмнөх тоглож буй аудиог таслаж, өөрийгөө "эзэн" болгоно.
    const seq = ++speakSeqRef.current;
    stopCurrentAudio();
    isBusyRef.current = true;
    setIsSpeaking(true);
    // Текстийг энд БИШ, аудио жинхэнэ тоглож эхлэх үед тавина (доор onplay) —
    // ингэснээр speech bubble-ийн бичиг дуу хоолойтойгоо синкждэнэ.
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      // Энэ хооронд илүү шинэ speak эхэлсэн бол энэ хариуг хаяна (давхцахгүй).
      if (seq !== speakSeqRef.current) return;
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`TTS алдаа: ${res.status} ${errText}`);
      }
      const blob = await res.blob();
      if (seq !== speakSeqRef.current) return;
      const url = URL.createObjectURL(blob);
      currentUrlRef.current = url;
      await new Promise((resolve, reject) => {
        const audio = new Audio(url);
        currentAudioRef.current = audio;
        audioResolveRef.current = resolve;
        // Дуу хоолой жинхэнэ эхлэх агшинд текстийг гаргаж синкжүүлнэ.
        audio.onplay = () => { if (seq === speakSeqRef.current) setLastText(text); };
        audio.onended = () => resolve();
        audio.onerror = (e) => reject(e);
        audio.play().catch(reject);
      });
    } catch (e) {
      if (seq === speakSeqRef.current) {
        console.error(e);
        setError("Дуу тоглуулахад алдаа гарлаа.");
      }
    } finally {
      // Зөвхөн ХАМГИЙН СҮҮЛИЙН speak л төлвийг цэвэрлэнэ (хуучин нь алгасна).
      if (seq === speakSeqRef.current) {
        stopCurrentAudio();
        setIsSpeaking(false);
        // TTS дуусаад echo намжих хүртэл хүлээнэ
        await new Promise((r) => setTimeout(r, 600));
        if (seq === speakSeqRef.current) isBusyRef.current = false;
      }
    }
  }, [stopCurrentAudio]);

  const chat = useCallback(
    async (userText) => {
      if (userText?.trim()) {
        messagesRef.current = [
          ...messagesRef.current,
          { role: "user", content: userText.trim() },
        ];
      }
      isBusyRef.current = true;
      setIsThinking(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nickname: nicknameRef.current,
            homeworkContext: homeworkRef.current,
            messages: messagesRef.current,
          }),
        });
        if (!res.ok) throw new Error("Chat алдаа");
        const { text } = await res.json();
        messagesRef.current = [
          ...messagesRef.current,
          { role: "assistant", content: text },
        ];
        setIsThinking(false);
        await speak(text);
      } catch (e) {
        console.error(e);
        setIsThinking(false);
        isBusyRef.current = false;
        setError("Серверт холбогдоход алдаа гарлаа.");
      }
    },
    [speak],
  );

  const processAudio = useCallback(
    async (chunks, mimeType) => {
      if (!chunks.length) return;
      // Аль хэдийн боловсруулж байвал алгасна
      if (isBusyRef.current) return;
      const blob = new Blob(chunks, { type: mimeType });
      const base64 = await blobToBase64(blob);
      isBusyRef.current = true;
      setIsThinking(true);
      try {
        const res = await fetch(`${API_BASE}/api/stt`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ audio: base64, mimeType }),
        });
        if (!res.ok) throw new Error("STT алдаа");
        const { text } = await res.json();
        setIsThinking(false);
        const cleaned = text?.trim();
        // Эхлээд команд (ж: "хоёр дахь бодлого") эсэхийг шалгана. Хэрэв команд
        // боловсруулагдвал TutorAvatar тухайн бодлогыг өөрөө тайлбарлаж эхэлнэ
        // (ярих/busy-г өөрөө удирдана), тиймээс энд chat руу дамжуулахгүй.
        if (cleaned && interpretCommandRef.current?.(cleaned)) return;
        if (cleaned) await chat(cleaned);
        else isBusyRef.current = false;
      } catch (e) {
        console.error(e);
        setIsThinking(false);
        isBusyRef.current = false;
        setError("Дуу таних алдаа гарлаа.");
      }
    },
    [chat],
  );

  // ── always-listen (VAD) ──────────────────────────────────
  const startAlwaysListen = useCallback(async () => {
    if (streamRef.current) return;

    let mimeType = "audio/webm;codecs=opus";
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";
    }
    mimeTypeRef.current = mimeType;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;

      vadRef.current = new VAD(stream, {
        threshold: 0.015,
        silenceMs: 1200,
        onSpeechStart: () => {
          if (isBusyRef.current) return; // avatar ярьж/бодож байна
          if (recorderRef.current) return; // аль хэдийн бичиж байна

          chunksRef.current = [];
          try {
            const recorder = new MediaRecorder(stream, { mimeType });
            recorder.ondataavailable = (e) => {
              if (e.data.size > 0) chunksRef.current.push(e.data);
            };
            recorder.start();
            recorderRef.current = recorder;
            setIsListening(true);
          } catch (e) {
            console.error("Recorder start error:", e);
          }
        },
        onSpeechEnd: () => {
          const recorder = recorderRef.current;
          if (!recorder || recorder.state === "inactive") {
            setIsListening(false);
            return;
          }
          recorderRef.current = null;
          setIsListening(false);
          const mime = mimeTypeRef.current;
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
      console.error(e);
      setError("Микрофон ашиглах зөвшөөрөл олдсонгүй.");
    }
  }, [processAudio]);

  const stopAlwaysListen = useCallback(() => {
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
    setIsListening(false);
  }, []);

  // ── greet (mount) ────────────────────────────────────────
  const greet = useCallback(async () => {
    messagesRef.current = [];
    await speak(
      `Сайн уу ${nicknameRef.current}! Хоёулаа гэрийн даалгавраа хамтдаа хийцгээе.`,
    );
    if (!homeworkRef.current) {
      await speak(
        `${nicknameRef.current}, эхлээд даалгаврынхаа зургийг зүүн талд оруулна уу.`,
      );
    }
  }, [speak]);

  // ── announce homework when first loaded ──────────────────
  const announceHomework = useCallback(async () => {
    messagesRef.current = [];
    await chat(null);
  }, [chat]);

  // ── сонгосон тодорхой бодлогыг тайлбарлах ────────────────
  // Контекстийг тухайн бодлого руу шилжүүлж, яриаг шинээр эхлүүлнэ.
  const explainProblem = useCallback(async (contextText) => {
    homeworkRef.current = contextText ?? "";
    messagesRef.current = [];
    await chat(null);
  }, [chat]);

  // ── hint: хүүхэд гацсан үед зөвлөгөө авах ───────────────
  const getHint = useCallback(async (wrongAnswer) => {
    const analysis = analysisRef.current;
    if (!analysis) return;
    try {
      const { hint } = await api.getHint({
        skill: analysis.skill,
        difficulty: analysis.difficulty,
        strategy: analysis.strategy,
        wrongAnswer,
        problem: homeworkRef.current,
      });
      if (hint) await speak(hint);
    } catch (e) {
      console.error(e);
    }
  }, [speak]);

  return {
    isSpeaking,
    isListening,
    isThinking,
    error,
    lastText,
    greet,
    announceHomework,
    explainProblem,
    speak,
    chat,
    getHint,
    startAlwaysListen,
    stopAlwaysListen,
  };
}
