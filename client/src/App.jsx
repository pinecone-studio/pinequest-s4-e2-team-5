import { useEffect, useState } from "react";
import "./App.css";
import { getPageFromPath } from "./navigation.js";
import { SplineScene } from "./components/SplineScene.jsx";
import { CameraOverlay } from "./components/CameraOverlay.jsx";

function App() {
  const [page, setPage] = useState(() =>
    getPageFromPath(window.location.pathname),
  );

  useEffect(() => {
    const handlePopState = () =>
      setPage(getPageFromPath(window.location.pathname));
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = (path) => {
    window.history.pushState({}, "", path);
    setPage(getPageFromPath(path));
  };

  if (page === "learn") {
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
            onClick={(event) => {
              event.preventDefault();
              navigate("/");
            }}
          ></a>
          <div className="step">Алхам 1 / 3</div>
        </nav>

        <div className="spline-frame">
          <SplineScene className="robot-spline" />
          <CameraOverlay />
        </div>
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
          <button className="start-button" onClick={() => navigate("/learn")}>
            Get started <span>→</span>
          </button>
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
