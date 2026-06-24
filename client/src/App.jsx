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
    const name = "хүүхэд";
    setSessionNickname(name);
    navigate("/learn", { nickname: name, avatar: "narsbagsh" });
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

  // TODO: Энд үндсэн web-ийн landing хуудас орно (өөр project-оос оруулна).
  // Доорх нь зөвхөн lesson хуудсуудыг шалгахад зориулсан түр холбоосууд.
  return (
    <main style={{ padding: 40, fontFamily: "sans-serif" }}>
      <h1>Placeholder — landing хуудас энд орно</h1>
      <p>Хуудаснууд руу очих түр холбоосууд:</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 260 }}>
        <button onClick={handleStart}>Эхлэх (Нарс багштай суралц)</button>
        <button onClick={() => navigate("/lesson")}>🎲 Тоо нэмэх дасгал</button>
        <button onClick={() => navigate("/typing-lesson")}>🔢 Тоо хасах дасгал</button>
      </div>
    </main>
  );
}

export default App;
