import { useEffect, useMemo, useState } from "react";
import "./App.css";
import "./components/avatar/avatar.css";
import { getPageFromPath } from "./navigation.js";
import { AvatarSession } from "./components/avatar/AvatarSession.jsx";
import { AvatarIntro } from "./components/avatar/AvatarIntro.jsx";
import { WarpTransition } from "./components/avatar/WarpTransition.jsx";
import { MathLesson } from "./components/lesson/components/MathLesson.jsx";
import { TypingLesson } from "./components/lesson/TypingLesson.jsx";
import { BigAddLesson } from "./components/lesson/BigAddLesson.jsx";
import Landing from "./components/Landing.jsx";
import { stopAllAudio } from "./components/avatar/audioBus.js";

function normalizeAvatar(avatar) {
  if (avatar === "robot" || avatar === "hero") return "robot";
  if (avatar === "minecraft") return "minecraft";
  if (avatar === "mcqueen") return "mcqueen";
  if (avatar === "astronaut") return "astronaut";
  if (avatar === "barbie") return "barbie";
  return "sun-buddy";
}

function App() {
  const [page, setPage] = useState(() =>
    getPageFromPath(window.location.pathname),
  );
  // Username → Bodoh хооронд warp шилжилт үзүүлэх үед {nickname, avatar}-г барина.
  const [warpTo, setWarpTo] = useState(null);
  // Эцэг эхийн хяналтад зориулсан нэг удаагийн 6 оронтой код
  const sessionCode = useMemo(() => String(Math.floor(100000 + Math.random() * 900000)), []);
  const selectedAvatar = normalizeAvatar(
    window.history.state?.avatar || window.sessionStorage.getItem("selectedAvatar"),
  );

  useEffect(() => {
    const handlePopState = () => {
      stopAllAudio();
      setPage(getPageFromPath(window.location.pathname));
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = (path, state = {}) => {
    stopAllAudio();
    window.history.pushState(state, "", path);
    // next/navigation шимийн usePathname-г синк байлгана. Үгүй бол PageTransition-ий
    // overlay буцаж хаагдахгүй үлдэж, дараагийн шилжилтэд дэлгэц харанхуйлж гацна.
    window.dispatchEvent(new Event("pushstate-internal"));
    setPage(getPageFromPath(path));
  };

  // Нэр авсны дараа шууд /learn руу үсрэхгүй — 2-3 сек warp шилжилт үзүүлнэ.
  if (warpTo) {
    return (
      <WarpTransition
        onDone={() => {
          setWarpTo(null);
          navigate("/learn", warpTo);
        }}
      />
    );
  }

  if (page === "start") {
    return (
      <AvatarIntro
        avatar={selectedAvatar}
        onBack={() => navigate("/")}
        onContinue={(nickname) =>
          setWarpTo({ nickname, avatar: selectedAvatar })
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

        <div className="parent-code-badge">
          Эцэг эхийн код: <strong>{sessionCode}</strong>
        </div>

        <AvatarSession nickname={name} avatar={avatar} sessionCode={sessionCode} />
      </main>
    );
  }


  return <Landing />;
}

export default App;
