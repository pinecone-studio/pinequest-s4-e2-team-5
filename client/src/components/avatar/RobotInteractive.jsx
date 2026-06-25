import { useMemo, useState } from "react";

export function RobotInteractive({ problem, isSpeaking, onCorrect, onWrong }) {
  const [answer, setAnswer] = useState("");

  const expected = useMemo(() => {
    if (!problem) return 0;
    switch (problem.op) {
      case "+": return problem.a + problem.b;
      case "-": return problem.a - problem.b;
      case "*": return problem.a * problem.b;
      case "/": return problem.a / problem.b;
      default:  return 0;
    }
  }, [problem]);

  function checkAnswer() {
    if (Number(answer) === expected) {
      onCorrect?.();
    } else {
      onWrong?.();
    }
  }

  return (
    <div className="ri-root">
      {/* Small robot — top-left corner */}
      <div className="ri-robot-corner">
        <span className={`ri-robot-emoji${isSpeaking ? " ri-robot-bounce" : ""}`}>
          🤖
        </span>
      </div>

      {/* Right: interactive content */}
      <div className="ri-content">
        {!problem ? (
          <>
            <h2 className="ri-idle-title">Робот даалгавар хүлээж байна</h2>
            <p className="ri-idle-sub">Бодлого оруулаад намайг засахад туслаарай!</p>
          </>
        ) : (
          <>
            {(() => {
              const mission = getMission(problem);
              return (
                <>
                  <h2 className="ri-mission-title">{mission.title}</h2>
                  <p className="ri-mission-story">{mission.story}</p>
                  <div className="ri-mission-visual">{mission.visual}</div>
                </>
              );
            })()}

            <div className="ri-answer-row">
              <input
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && checkAnswer()}
                placeholder="Хариугаа оруул..."
                className="ri-answer-input"
              />
              <button onClick={checkAnswer} className="ri-answer-btn">
                Шалгах
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function getMission(problem) {
  const { a, b, op } = problem;
  switch (op) {
    case "+":
      return {
        title: "Батарей цэнэглэх мисс",
        story: `Робот ${a}% цэнэгтэй байна. Дахиад ${b}% энерги олж өгөөд роботыг асаагаарай.`,
        visual: `🔋 ${a}%  + ⚡ ${b}`,
      };
    case "-":
      return {
        title: "Эвдэрсэн эд анги",
        story: `Робот ${a} ширхэг боолттой байсан. ${b} нь уначихжээ. Хэд үлдсэн бол?`,
        visual: `🔩 x ${a}   ➜   ❌ ${b}`,
      };
    case "*":
      return {
        title: "Робот үйлдвэр",
        story: `${a} робот байна. Робот бүрт ${b} батарей хэрэгтэй.`,
        visual: `🤖 x ${a}   ⚡ x ${b}`,
      };
    case "/":
      return {
        title: "Энерги хуваарилах",
        story: `${a} энергийн кристаллыг ${b} роботод тэнцүү хуваарил.`,
        visual: `💎 ${a} ÷ 🤖 ${b}`,
      };
    default:
      return { title: "Robot Mission", story: "", visual: "🤖" };
  }
}
