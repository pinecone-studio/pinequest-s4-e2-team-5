import { useCallback, useEffect, useRef, useState } from "react";
import { MascotScene } from "../KidMascotScene.jsx";
import { DEFAULT_MASCOT } from "../mascotConfig.js";
import { API_BASE } from "../../lib/config.js";
import "./avatar-intro.css";

const ROBOT_INTRO_TEXT =
  "Сайн байна уу? Таны нэрийг хэн гэдэг вэ? Намайг JoyLearn AI гэдэг.";

// Full-screen intro: the 3D tutor greets the child and asks for a name.
// After the name is submitted we continue to the real lesson page (/learn).
export function AvatarIntro({ onContinue, onBack, avatar = DEFAULT_MASCOT.id }) {
  const [name, setName] = useState("");
  const introPlayedRef = useRef(false);
  const introPlayingRef = useRef(false);
  const introAudioRef = useRef(null);
  const introAudioUrlRef = useRef("");
  const mascotName = avatar === "robot" ? "Робот" : DEFAULT_MASCOT.name;

  const cleanupIntroAudio = useCallback(() => {
    introAudioRef.current?.pause();
    introAudioRef.current = null;
    if (introAudioUrlRef.current) {
      URL.revokeObjectURL(introAudioUrlRef.current);
      introAudioUrlRef.current = "";
    }
  }, []);

  const playRobotIntro = useCallback(async () => {
    if (avatar !== "robot" || introPlayedRef.current || introPlayingRef.current) return;

    introPlayingRef.current = true;
    try {
      const response = await fetch(`${API_BASE}/api/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: ROBOT_INTRO_TEXT }),
      });
      if (!response.ok) throw new Error("Robot intro TTS failed");

      cleanupIntroAudio();
      const blob = await response.blob();
      introAudioUrlRef.current = URL.createObjectURL(blob);
      introAudioRef.current = new Audio(introAudioUrlRef.current);
      await introAudioRef.current.play();
      introPlayedRef.current = true;
    } catch (error) {
      console.warn("Robot intro voice could not play:", error);
    } finally {
      introPlayingRef.current = false;
    }
  }, [avatar, cleanupIntroAudio]);

  useEffect(() => {
    playRobotIntro();

    return cleanupIntroAudio;
  }, [playRobotIntro, cleanupIntroAudio]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onContinue(name.trim() || "хүүхэд");
  };

  return (
    <div className="avatar-intro" onPointerDown={playRobotIntro}>
      <button
        className="avatar-intro__back"
        onClick={onBack}
        aria-label="Нүүр хуудас руу буцах"
      >
        ←
      </button>

      <div className="avatar-intro__scene">
        <MascotScene avatar={avatar} className="avatar-intro__mascot" mood="speaking" />
      </div>

      <form className="avatar-intro__panel" onSubmit={handleSubmit} onFocusCapture={playRobotIntro}>
        <h1 className="avatar-intro__title">Сайн уу! 👋</h1>
        <p className="avatar-intro__subtitle">
          Намайг <strong>{mascotName}</strong> гэдэг. Чиний нэр хэн бэ?
        </p>
        <input
          className="avatar-intro__input"
          type="text"
          value={name}
          onChange={(e) => {
            playRobotIntro();
            setName(e.target.value);
          }}
          placeholder="Нэрээ бичээрэй"
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
