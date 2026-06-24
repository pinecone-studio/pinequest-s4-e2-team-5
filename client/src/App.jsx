import { useEffect, useState } from "react";
import "./App.css";
import "./components/avatar/avatar.css";
import { getPageFromPath } from "./navigation.js";
import { AvatarSession } from "./components/avatar/AvatarSession.jsx";
import { MathLesson } from "./components/lesson/MathLesson.jsx";
import { TypingLesson } from "./components/lesson/TypingLesson.jsx";

function App() {
  const [page, setPage] = useState(() =>
    getPageFromPath(window.location.pathname),
  );
  const [nickname, setNickname]             = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("narsbagsh");
  const [sessionNickname, setSessionNickname] = useState("");

  useEffect(() => {
    const handlePopState = () =>
      setPage(getPageFromPath(window.location.pathname));
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = (path, state = {}) => {
    window.history.pushState(state, "", path);
    setPage(getPageFromPath(path));
  };

  const handleStart = () => {
    const name = nickname.trim() || "хүүхэд";
    setSessionNickname(name);
    navigate("/learn", { nickname: name, avatar: selectedAvatar });
  };

  if (page === "lesson") {
    return <MathLesson onBack={() => navigate("/")} />;
  }

  if (page === "typing-lesson") {
    return <TypingLesson onBack={() => navigate("/")} />;
  }

  if (page === "learn") {
    const name = sessionNickname || window.history.state?.nickname || "хүүхэд";
    return (
      <main className="learn-page">
        <nav className="topbar">
          <button
            className="back-button"
            onClick={() => navigate("/")}
            aria-label="Нүүр хуудас руу буцах"
          >
            ←
          </button>
          <a
            className="brand"
            href="/"
            onClick={(e) => {
              e.preventDefault();
              navigate("/");
            }}
          ></a>
          <div className="step">Нарс багштай суралц</div>
        </nav>

        <AvatarSession nickname={name} />
      </main>
    );
  }

  return (
    <main className="home-page">
      <nav className="home-nav">
        <a
          className="brand"
          href="/"
          onClick={(event) => event.preventDefault()}
        >
          <span>Q</span>
        </a>
        <p>Хүүхэд бүр бодож чадна.</p>
      </nav>

      <section className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow">МОНГОЛ AI БАГШ</p>
          <h1>
            Математикийг
            <br />
            <em>тоглож</em> ойлгоё.
          </h1>
          <p>
            Бодлогын зургаа оруулаарай. AI багш хүүхдэд хариуг нь хэлэхгүй,
            өөрөөр нь ойлгуулж бодуулна.
          </p>

          {/* Avatar module — landing form */}
          <div className="landing-form">
            <div>
              <label className="landing-field-label" htmlFor="nickname-input">
                Нэрээ оруул
              </label>
              <input
                id="nickname-input"
                type="text"
                className="landing-name-input"
                placeholder="Жишээ: Болд, Нарангэрэл…"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleStart()}
                maxLength={30}
              />
            </div>

            <div>
              <label className="landing-field-label">Багш сонго</label>
              <div className="avatar-cards">
                <button
                  type="button"
                  className={`avatar-card${selectedAvatar === "narsbagsh" ? " avatar-selected" : ""}`}
                  onClick={() => setSelectedAvatar("narsbagsh")}
                >
                  <span className="avatar-card-icon">🤖</span>
                  <span className="avatar-card-name">Нарс багш</span>
                </button>
              </div>
            </div>

            <button className="start-button" onClick={handleStart}>
              Эхлэх <span>→</span>
            </button>

            <button
              className="choose-button"
              style={{ marginTop: 12, fontSize: 14, padding: "0 20px", display: "flex", alignItems: "center", gap: 10 }}
              onClick={() => navigate("/lesson")}
            >
              🎲 Тоо нэмэх дасгал
            </button>

            <button
              className="choose-button"
              style={{ marginTop: 8, fontSize: 14, padding: "0 20px", display: "flex", alignItems: "center", gap: 10 }}
              onClick={() => navigate("/typing-lesson")}
            >
              🔢 Тоо хасах дасгал
            </button>
          </div>
        </div>

        <div className="number-art" aria-hidden="true">
          <span className="orb orb-one">1</span>
          <span className="orb orb-two">2</span>
          <span className="orb orb-three">3</span>
          <div className="smile">⌣</div>
        </div>
      </section>
    </main>
  );
}

export default App;
