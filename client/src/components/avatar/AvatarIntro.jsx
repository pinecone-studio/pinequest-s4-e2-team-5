import { useCallback, useEffect, useRef, useState } from "react";
import { MascotScene } from "../KidMascotScene.jsx";
import { SplineScene } from "../SplineScene.jsx";
import { MinecraftSteveScene } from "./MinecraftSteveScene.jsx";
import RocketLoader from "./RocketLoader.jsx";
import { DEFAULT_MASCOT } from "../mascotConfig.js";
import { API_BASE } from "../../lib/config.js";
import { useVoiceCapture } from "./useVoiceCapture.js";
import { extractName } from "./extractName.js";
import { registerAudio, getNavEpoch } from "./audioBus.js";
import "./avatar-intro.css";

const AVATAR_INTRO_TEXT = {
  robot: "Сайн уу? Чамайг хэн гэдэг вэ? Намайг Роби гэдэг.",
  minecraft: "Сайн уу! Намайг Стив гэдэг. Чамайг хэн гэдэг вэ?",
  mcqueen: "Сайн уу! Намайг Маккуин гэдэг. Чамайг хэн гэдэг вэ?",
  astronaut: "Сайн уу! Би сансрын нисгэгч. Чамайг хэн гэдэг вэ?",
};
const MCQ_BOLTS = [
  { top: "20%", left: "12%", s: 30, dur: "6.5s" },
  { top: "30%", left: "84%", s: 38, dur: "8s" },
  { top: "46%", left: "6%", s: 24, dur: "7.2s" },
  { top: "54%", left: "90%", s: 28, dur: "6.8s" },
];

export function AvatarIntro({
  onContinue,
  onBack,
  avatar = DEFAULT_MASCOT.id,
}) {
  const [name, setName] = useState("");
  const [launching, setLaunching] = useState(false);
  const isRobot = avatar === "robot";
  const isMinecraft = avatar === "minecraft";
  const isMcqueen = avatar === "mcqueen";
  const isAstronaut = avatar === "astronaut";

  const introPlayedRef = useRef(false);
  const introPlayingRef = useRef(false);
  const audioRef = useRef(null);
  const audioUrlRef = useRef("");
  const continuedRef = useRef(false);

  // ЗАССАН: Конфликт болон синтаксын алдааг арилгаж, тернари операторыг цэгцэлсэн
  const mascotName = isRobot
    ? "Robi"
    : isMinecraft
      ? "Стив"
      : avatar === "mcqueen"
        ? "McQueen"
        : avatar === "astronaut"
          ? "Сансрын нисгэгч"
          : avatar === "barbie"
            ? "Barbie"
            : DEFAULT_MASCOT.name;

  const cleanupAudio = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = "";
    }
  }, []);

  const playTts = useCallback(
    async (text) => {
      cleanupAudio();
      const epoch = getNavEpoch();
      const response = await fetch(`${API_BASE}/api/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!response.ok) throw new Error("TTS failed");
      const blob = await response.blob();
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

  const pauseRef = useRef(null);
  const stopRef = useRef(null);

  const handleVoiceName = useCallback(
    async (text) => {
      if (continuedRef.current) return;
      const nm = extractName(text);
      if (!nm) return;
      continuedRef.current = true;
      setName(nm);
      pauseRef.current?.();
      try {
        await playTts(`Сайн  уу, ${nm}! Одоо даалгавараа  хийцгээе.`);
      } catch (e) {
        console.warn("Мэндчилгээ тоглуулж чадсангүй:", e);
      }
      stopRef.current?.();
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

  const introText = AVATAR_INTRO_TEXT[avatar] ?? AVATAR_INTRO_TEXT.robot;

  const playIntro = useCallback(async () => {
    if (introPlayedRef.current || introPlayingRef.current) return;
    introPlayingRef.current = true;
    pause();
    try {
      await playTts(introText);
      introPlayedRef.current = true;
    } catch (error) {
      console.warn("Avatar intro voice could not play:", error);
    } finally {
      introPlayingRef.current = false;
      if (!continuedRef.current) resume();
    }
  }, [introText, playTts, pause, resume]);

  useEffect(() => {
    pause();
    start();
    playIntro();
    return () => {
      stop();
      cleanupAudio();
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (continuedRef.current) return;
    continuedRef.current = true;
    stop();
    cleanupAudio();
    const finalName = name.trim() || "хүүхэд";
    // Сансрын нисгэгч: нэр авмагц пуужин жинхэнэ хөөрөлт мэт дээш нисч,
    // анимаци дуусмагц дараагийн (learn) хуудас руу шилжинэ.
    if (isAstronaut) {
      setLaunching(true);
      setTimeout(() => onContinue(finalName), 1700);
      return;
    }
    onContinue(finalName);
  };

  return (
    <div
      className={`avatar-intro${isRobot ? " avatar-intro--joy" : isMinecraft ? " avatar-intro--mc" : isMcqueen ? " avatar-intro--mcq" : isAstronaut ? " avatar-intro--astro" : ""}${launching ? " is-launching" : ""}`}
      onPointerDown={playIntro}
    >
      <button
        className="avatar-intro__back"
        onClick={onBack}
        aria-label="Нүүр хуудас руу буцах"
      >
        ←
      </button>

      <div className="avatar-intro__scene">
        {isRobot ? (
          <SplineScene className="avatar-intro__mascot" />
        ) : isMinecraft ? (
          <MinecraftSteveScene mood={listening ? "listening" : "speaking"} />
        ) : isAstronaut ? (
          <div
            className={`avatar-intro__rocket${launching ? " is-launch" : ""}`}
          >
            <RocketLoader />
          </div>
        ) : isMcqueen ? (
          <>
            <div className="mcq-bg" aria-hidden="true">
              <span className="mcq-sun" />
              <span
                className="mc-cloud"
                style={{
                  top: "16%",
                  left: "8%",
                  width: 96,
                  height: 28,
                  animationDuration: "16s",
                }}
              />
              <span
                className="mc-cloud"
                style={{
                  top: "10%",
                  left: "62%",
                  width: 124,
                  height: 32,
                  animationDuration: "20s",
                }}
              />
              <img
                className="mcq-logo"
                src="/cars.png"
                alt=""
                draggable="false"
              />
              <span className="mcq-flag mcq-flag--l" />
              <span className="mcq-flag mcq-flag--r" />
              {MCQ_BOLTS.map((b, i) => (
                <span
                  key={i}
                  className="mcq-bolt"
                  style={{
                    top: b.top,
                    left: b.left,
                    "--s": `${b.s}px`,
                    animationDuration: b.dur,
                  }}
                >
                  ⚡
                </span>
              ))}
              <div className="mcq-road">
                <span className="mcq-lane" />
              </div>
              <span className="mcq-cone" style={{ left: "10%" }} />
              <span className="mcq-cone" style={{ left: "26%" }} />
              <span className="mcq-cone" style={{ right: "30%" }} />
              <img
                className="mcq-buddy-car"
                src="/mater.png"
                alt=""
                draggable="false"
              />
            </div>
            <div className="avatar-intro__mcq-wrap">
              <img
                className="mcq-main-img"
                src="/McQueen.png"
                alt="Маккуин найз"
                draggable="false"
              />
            </div>
          </>
        ) : (
          <MascotScene
            avatar={avatar}
            className="avatar-intro__mascot"
            mood="speaking"
          />
        )}
      </div>

      <form
        className="avatar-intro__panel"
        onSubmit={handleSubmit}
        onFocusCapture={playIntro}
      >
        <h1 className="avatar-intro__title">Сайн уу!</h1>
        <p className="avatar-intro__subtitle">
          Намайг <strong>{mascotName}</strong> гэдэг. Чамайг хэн гэдэг вэ?
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
          Үгрелжлүүлэх →
        </button>
      </form>
    </div>
  );
}
