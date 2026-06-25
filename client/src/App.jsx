import { useEffect, useState } from "react";
import "./App.css";
import "./components/avatar/avatar.css";
import { getPageFromPath } from "./navigation.js";
import { AvatarSession } from "./components/avatar/AvatarSession.jsx";
import { AvatarIntro } from "./components/avatar/AvatarIntro.jsx";
import { MathLesson } from "./components/lesson/MathLesson.jsx";
import { TypingLesson } from "./components/lesson/TypingLesson.jsx";
import { BigAddLesson } from "./components/lesson/BigAddLesson.jsx";
import Landing from "./components/Landing.jsx";

function normalizeAvatar(avatar) {
  if (avatar === "robot" || avatar === "hero") return "robot";
  return "sun-buddy";
}

function App() {
  const [page, setPage] = useState(() =>
    getPageFromPath(window.location.pathname),
  );
  const selectedAvatar = normalizeAvatar(
    window.history.state?.avatar || window.sessionStorage.getItem("selectedAvatar"),
  );

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

  if (page === "big-add-lesson") {
    return <BigAddLesson onBack={() => navigate("/")} />;
  }

  if (page === "learn") {
    const name = window.history.state?.nickname || "хүүхэд";
    const avatar = normalizeAvatar(window.history.state?.avatar || selectedAvatar);
    return (
      <main className="learn-page">
        <button
          className="learn-back"
          onClick={() => navigate("/")}
          aria-label="Нүүр хуудас руу буцах"
        >
          ←
        </button>

        <AvatarSession nickname={name} avatar={avatar} />
      </main>
    );
  }

  // Үндсэн landing хуудас (өмнө нь Next.js project байсныг энд оруулсан).
  return <Landing />;
}

export default App;
