import { useEffect, useState } from "react";
import "./App.css";
import "./components/avatar/avatar.css";
import { getPageFromPath } from "./navigation.js";
import { AvatarSession } from "./components/avatar/AvatarSession.jsx";
import { AvatarIntro } from "./components/avatar/AvatarIntro.jsx";
import { MathLesson } from "./components/lesson/MathLesson.jsx";
import { TypingLesson } from "./components/lesson/TypingLesson.jsx";
import Landing from "./components/Landing.jsx";

function App() {
  const [page, setPage] = useState(() =>
    getPageFromPath(window.location.pathname),
  );
  const selectedAvatar =
    window.history.state?.avatar ||
    window.sessionStorage.getItem("selectedAvatar") ||
    "sun-buddy";

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

  if (page === "start") {
    return (
      <AvatarIntro
        avatar={selectedAvatar}
        onBack={() => navigate("/")}
        onContinue={(nickname) =>
          navigate("/learn", { nickname, avatar: selectedAvatar })
        }
      />
    );
  }

  if (page === "lesson") {
    return <MathLesson onBack={() => navigate("/")} />;
  }

  if (page === "typing-lesson") {
    return <TypingLesson onBack={() => navigate("/")} />;
  }

  if (page === "learn") {
    const name = window.history.state?.nickname || "хүүхэд";
    const avatar = window.history.state?.avatar || selectedAvatar;
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
          <div className="step">Нархан найзтай суралц</div>
        </nav>

        <AvatarSession nickname={name} avatar={avatar} />
      </main>
    );
  }

  // Үндсэн landing хуудас (өмнө нь Next.js project байсныг энд оруулсан).
  return <Landing />;
}

export default App;
