import ProgressBar from "./components/ProgressBar";
import CoinCounter from "./components/CoinCounter";
import LifeBar from "./components/LifeBar";
import SpeechBubble from "./components/SpeechBubble";
import LessonLayout from "./components/LessonLayout";
import Mascot from "./Mascot";

export default function MathLesson({ current, total, lives, coins, speechText }) {
  return (
    <div className="math-lesson">
      <ProgressBar current={current} total={total} />
      <CoinCounter coins={coins} />
      <LifeBar lives={lives} />
      <SpeechBubble text={speechText} />
      <LessonLayout
        mascot={<Mascot />}
        speech="Let's solve this!"
        current={2}
        total={10}
        lives={3}
        coins={80}
      >
        энд тоглоомоо тавина
      </LessonLayout>
    </div>
  );
}
