import { useState } from "react";
import { MascotScene } from "../KidMascotScene.jsx";
import { DEFAULT_MASCOT } from "../mascotConfig.js";
import "./avatar-intro.css";

// Full-screen intro: the 3D tutor greets the child and asks for a name.
// After the name is submitted we continue to the real lesson page (/learn).
export function AvatarIntro({ onContinue, onBack, avatar = DEFAULT_MASCOT.id }) {
  const [name, setName] = useState("");
  const mascotName = avatar === "robot" ? "Робот" : DEFAULT_MASCOT.name;

  const handleSubmit = (e) => {
    e.preventDefault();
    onContinue(name.trim() || "хүүхэд");
  };

  return (
    <div className="avatar-intro">
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

      <form className="avatar-intro__panel" onSubmit={handleSubmit}>
        <h1 className="avatar-intro__title">Сайн уу! 👋</h1>
        <p className="avatar-intro__subtitle">
          Намайг <strong>{mascotName}</strong> гэдэг. Чиний нэр хэн бэ?
        </p>
        <input
          className="avatar-intro__input"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
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
