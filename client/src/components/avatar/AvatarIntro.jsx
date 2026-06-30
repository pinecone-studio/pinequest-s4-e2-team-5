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

// Minecraft /start дэлгэцийн чимэглэл — зүүн/баруун тэнцвэртэй хөвөгч эд зүйлс.
const MC_FLOATERS = [
  { src: "/block.png", top: "12%", left: "7%", s: 70, dur: "7s" }, // өвсний блок
  { src: "/sukh.png", top: "36%", left: "3%", s: 60, dur: "9s" }, // pickaxe
  { src: "/lerobrine.png", top: "50%", left: "6%", s: 56, dur: "7.8s" }, // алмаз блок
  { src: "/borblock.png", top: "13%", left: "83%", s: 64, dur: "8.5s" }, // модон блок
  { src: "/gal.png", top: "34%", left: "91%", s: 44, dur: "6.5s" }, // дэнлүү
  { src: "/mavis.png", top: "57%", left: "85%", s: 56, dur: "8.2s" }, // зуух
];

// McQueen /start — хөвөгч аянгын тэмдэг (хурд + Cars сэдэв).
const MCQ_BOLTS = [
  { top: "20%", left: "12%", s: 30, dur: "6.5s" },
  { top: "30%", left: "84%", s: 38, dur: "8s" },
  { top: "46%", left: "6%", s: 24, dur: "7.2s" },
  { top: "54%", left: "90%", s: 28, dur: "6.8s" },
];

// Full-screen intro: the 3D tutor greets the child and asks for a name.
// The child can speak the name (mic) or type it. After the name is captured we
// greet by name and continue to the real lesson page (/learn).
export function AvatarIntro({ onContinue, onBack, avatar = DEFAULT_MASCOT.id }) {
  const [name, setName] = useState("");
  const isRobot = avatar === "robot";
  const isMinecraft = avatar === "minecraft";
  const isMcqueen = avatar === "mcqueen";
  

  const introPlayedRef = useRef(false);
  const introPlayingRef = useRef(false);
  const audioRef = useRef(null);
  const audioUrlRef = useRef("");
  const continuedRef = useRef(false);
  const mascotName = isRobot
    ? "Joy"
    : avatar === "minecraft"
      ? "Minecraft"
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
    <div
      className={`avatar-intro${isRobot ? " avatar-intro--joy" : isMinecraft ? " avatar-intro--mc" : isMcqueen ? " avatar-intro--mcq" : ""}`}
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
        ) : isMinecraft ? (
          <>
            <div className="mc-bg" aria-hidden="true">
              <span className="mc-sun" />
              <span className="mc-cloud" style={{ top: "13%", left: "10%", width: 92, height: 26, animationDuration: "15s" }} />
              <span className="mc-cloud" style={{ top: "27%", left: "60%", width: 120, height: 30, animationDuration: "19s" }} />
              <span className="mc-cloud" style={{ top: "19%", left: "38%", width: 66, height: 22, animationDuration: "12s" }} />
              <div className="mc-ground" />
              {MC_FLOATERS.map((f, i) => (
                <img
                  key={i}
                  className="mc-deco"
                  src={f.src}
                  alt=""
                  draggable="false"
                  style={{ top: f.top, left: f.left, "--s": `${f.s}px`, animationDuration: f.dur }}
                />
              ))}
            </div>
            <div className="avatar-intro__mc-wrap">
              <img className="mc-main-img" src="/maynkrap.png" alt="Майнкрафт найз" draggable="false" />
            </div>
          </>
        ) : isMcqueen ? (
          <>
            <div className="mcq-bg" aria-hidden="true">
              <span className="mcq-sun" />
              <span className="mc-cloud" style={{ top: "16%", left: "8%", width: 96, height: 28, animationDuration: "16s" }} />
              <span className="mc-cloud" style={{ top: "10%", left: "62%", width: 124, height: 32, animationDuration: "20s" }} />
              <img className="mcq-logo" src="/cars.png" alt="" draggable="false" />
              <span className="mcq-flag mcq-flag--l" />
              <span className="mcq-flag mcq-flag--r" />
              {MCQ_BOLTS.map((b, i) => (
                <span
                  key={i}
                  className="mcq-bolt"
                  style={{ top: b.top, left: b.left, "--s": `${b.s}px`, animationDuration: b.dur }}
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
              <img className="mcq-buddy-car" src="/mater.png" alt="" draggable="false" />
            </div>
            <div className="avatar-intro__mcq-wrap">
              <img className="mcq-main-img" src="/McQueen.png" alt="Маккуин найз" draggable="false" />
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
