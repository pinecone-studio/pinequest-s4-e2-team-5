import "./LessonLayout.css";

import ProgressBar from "./ProgressBar";
import CoinCounter from "./CoinCounter";
import LifeBar from "./LifeBar";
import SpeechBubble from "./SpeechBubble";

export default function LessonLayout({
  mascot,
  speech,
  current,
  total,
  lives,
  coins,
  children,
}) {
  return (
    <div className="lesson-layout">

      {/* Left */}
      <div className="lesson-left">

        <SpeechBubble text={speech} />

        <div className="lesson-mascot">
          {mascot}
        </div>

      </div>

      {/* Right */}
      <div className="lesson-right">

        <div className="lesson-top">

          <ProgressBar
            current={current}
            total={total}
          />

          <div className="lesson-info">

            <LifeBar lives={lives} />

            <CoinCounter coins={coins} />

          </div>

        </div>

        <div className="lesson-content">

          {children}

        </div>

      </div>

    </div>
  );
}