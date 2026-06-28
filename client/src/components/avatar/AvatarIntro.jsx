import { useCallback, useEffect, useRef, useState } from "react";
import { MascotScene } from "../KidMascotScene.jsx";
import { JoyBackground, JoyRobot } from "./JoyScene.jsx";
import { DEFAULT_MASCOT } from "../mascotConfig.js";
import { API_BASE } from "../../lib/config.js";
import { useVoiceCapture } from "./useVoiceCapture.js";
import { extractName } from "./extractName.js";
import { registerAudio, getNavEpoch } from "./audioBus.js";
import "./avatar-intro.css";

const ROBOT_INTRO_TEXT =
  "Сайн байна уу? Таны нэрийг хэн гэдэг вэ? Намайг Жой гэдэг.";

// Full-screen intro: the 3D tutor greets the child and asks for a name.
// The child can speak the name (mic) or type it. After the name is captured we
// greet by name and continue to the real lesson page (/learn).
export function AvatarIntro({ onContinue, onBack, avatar = DEFAULT_MASCOT.id }) {
  const [name, setName] = useState("");
  const isRobot = avatar === "robot";

  const introPlayedRef = useRef(false);
  const introPlayingRef = useRef(false);
  const audioRef = useRef(null);
  const audioUrlRef = useRef("");
  const continuedRef = useRef(false);
  const mascotName = isRobot ? "Жой" : DEFAULT_MASCOT.name;

  const cleanupAudio = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = "";
    }
  }, []);

  // Текстийг дуу болгож тоглуулаад, дуусахыг хүлээнэ.
  const playTts = useCallback(
    async (text) => {
      cleanupAudio();
      // Шилжилт болсон эсэхийг fetch-ийн өмнө барьж аваад дараа нь шалгана.
      const epoch = getNavEpoch();
      const response = await fetch(`${API_BASE}/api/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!response.ok) throw new Error("TTS failed");
      const blob = await response.blob();
      // Fetch явж байх зуур хуудас шилжсэн бол дуу эхлүүлэхгүй.
      if (epoch !== getNavEpoch()) return;
      audioUrlRef.current = URL.createObjectURL(blob);
      const audio = new Audio(audioUrlRef.current);
      audioRef.current = audio;
      registerAudio(audio, audioUrlRef.current);
      await new Promise((resolve) => {
        audio.onended = resolve;
        audio.onerror = resolve;
        audio.play().catch(resolve);
      });
    },
    [cleanupAudio],
  );

  // handleVoiceName-д хамгийн сүүлийн pause/stop-г дуудахын тулд ref-д хадгална
  // (useVoiceCapture-аас доор үүснэ — TDZ-ээс сэргийлж ref ашиглав).
  const pauseRef = useRef(null);
  const stopRef = useRef(null);

  // Хүүхэд нэрээ хэлэхэд: input-д бичиж, нэрээр нь мэндчилээд /learn руу шилжинэ.
  const handleVoiceName = useCallback(
    async (text) => {
      if (continuedRef.current) return;
      const nm = extractName(text);
      if (!nm) return;
      continuedRef.current = true;
      setName(nm);
      pauseRef.current?.(); // сонсохоо түр болино
      try {
        await playTts(`Сайн байна уу, ${nm}! Одоо хичээлээ хийцгээе.`);
      } catch (e) {
        console.warn("Мэндчилгээ тоглуулж чадсангүй:", e);
      }
      stopRef.current?.(); // микрофон чөлөөлнө
      onContinue(nm);
    },
    [playTts, onContinue],
  );

  const { listening, start, pause, resume, stop } = useVoiceCapture({
    onResult: handleVoiceName,
  });

  useEffect(() => {
    pauseRef.current = pause;
    stopRef.current = stop;
  });

  const playIntro = useCallback(async () => {
    if (!isRobot || introPlayedRef.current || introPlayingRef.current) return;
    introPlayingRef.current = true;
    pause(); // интро ярьж байх үед сонсохгүй (echo-оос сэргийлнэ)
    try {
      await playTts(ROBOT_INTRO_TEXT);
      introPlayedRef.current = true;
    } catch (error) {
      console.warn("Robot intro voice could not play:", error);
    } finally {
      introPlayingRef.current = false;
      if (!continuedRef.current) resume(); // одоо хүүхдийн яриаг сонсоно
    }
  }, [isRobot, playTts, pause, resume]);

  useEffect(() => {
    if (!isRobot) return;
    // Микрофон бэлдээд (зөвшөөрөл аваад) интрог тоглуулна. Интро дуустал сонсохгүй.
    pause();
    start();
    playIntro();
    return () => {
      stop();
      cleanupAudio();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRobot]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (continuedRef.current) return;
    continuedRef.current = true;
    stop();
    cleanupAudio();
    onContinue(name.trim() || "хүүхэд");
  };

  return (
    <div className={`avatar-intro${isRobot ? " avatar-intro--joy" : ""}`} onPointerDown={playIntro}>
      <button
        className="avatar-intro__back"
        onClick={onBack}
        aria-label="Нүүр хуудас руу буцах"
      >
        ←
      </button>

      <div className="avatar-intro__scene">
        {isRobot ? (
          <>
            <JoyBackground />
            <div className="avatar-intro__joy-wrap">
              <span className="avatar-intro__joy-glow" aria-hidden="true" />
              <JoyRobot
                className="avatar-intro__joy"
                mood={listening ? "listening" : "speaking"}
              />
            </div>
          </>
        ) : (
          <MascotScene avatar={avatar} className="avatar-intro__mascot" mood="speaking" />
        )}
      </div>

      <form className="avatar-intro__panel" onSubmit={handleSubmit} onFocusCapture={playIntro}>
        <h1 className="avatar-intro__title">Сайн уу! 👋</h1>
        <p className="avatar-intro__subtitle">
          Намайг <strong>{mascotName}</strong> гэдэг. Чиний нэр хэн бэ?
        </p>
        {isRobot && listening && (
          <p className="avatar-intro__listening">
            <span className="avatar-intro__listening-dot" />
            Сонсож байна…
          </p>
        )}
        <input
          className="avatar-intro__input"
          type="text"
          value={name}
          onChange={(e) => {
            playIntro();
            setName(e.target.value);
          }}
          placeholder="Нэрээ хэлээрэй эсвэл бичээрэй"
          maxLength={24}
          autoFocus
        />
        <button type="submit" className="avatar-intro__submit">
          Үргэлжлүүлэх →
        </button>
      </form>
    </div>
  );
}
