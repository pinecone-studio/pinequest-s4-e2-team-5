import { useState, useEffect, useCallback } from 'react';
import './lesson.css';
import { DraggableTile } from './DraggableTile.jsx';
import { DropZone } from './DropZone.jsx';
import { Mascot } from './Mascot.jsx';

const COLORS = {
  1:  '#f2a36b',
  2:  '#f6cf69',
  3:  '#80b7c7',
  4:  '#6abf8e',
  5:  '#f48fb1',
  6:  '#ce93d8',
  7:  '#ff8a65',
  8:  '#4db6ac',
  9:  '#7986cb',
  10: '#a5d6a7',
};

const TOTAL_ROUNDS = 5;

function generateDistractors(answer) {
  const set = new Set();
  for (const o of [-3, -2, -1, 1, 2, 3, 4, -4]) {
    const v = answer + o;
    if (v > 0 && v !== answer) set.add(v);
    if (set.size >= 3) break;
  }
  return [...set].slice(0, 3);
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildRound(round, score) {
  return { round, score, num1: null, num2: null, choices: [], selected: null, phase: 'drag', correct: null };
}

function StarCounter({ score }) {
  return (
    <div className="star-counter">
      {[...Array(TOTAL_ROUNDS)].map((_, i) => (
        <span key={i} className={i < score ? 'star-filled' : 'star-empty'}>
          {i < score ? '★' : '☆'}
        </span>
      ))}
    </div>
  );
}

// Shows counting steps inside the mascot bubble
function CountBubble({ num1, num2 }) {
  const steps = [...Array(num2)].map((_, i) => num1 + i + 1);
  return (
    <div className="bubble-trail" key={`${num1}-${num2}`}>
      {steps.map((n, i) => (
        <span
          key={n}
          className={`bubble-step${i === steps.length - 1 ? ' final-step' : ''}`}
          style={{ animationDelay: `${i * 0.09}s` }}
        >
          {n}
        </span>
      ))}
    </div>
  );
}

export function MathLesson({ onBack }) {
  const [state, setState] = useState(() => buildRound(1, 0));
  const { round, score, num1, num2, choices, selected, phase, correct } = state;

  // When both zones filled → generate choices from actual dragged values
  useEffect(() => {
    if (num1 !== null && num2 !== null && phase === 'drag') {
      const answer = num1 + num2;
      const newChoices = shuffle([answer, ...generateDistractors(answer)]);
      setState(s => ({ ...s, phase: 'choose', choices: newChoices }));
    }
  }, [num1, num2, phase]);

  // Auto-advance after result feedback
  useEffect(() => {
    if (phase !== 'result') return;
    const id = setTimeout(() => {
      if (correct) {
        const newScore = score + 1;
        setState(round >= TOTAL_ROUNDS
          ? s => ({ ...s, score: newScore, phase: 'done' })
          : buildRound(round + 1, newScore)
        );
      } else {
        setState(s => ({ ...s, num1: null, num2: null, selected: null, phase: 'drag', correct: null }));
      }
    }, 1400);
    return () => clearTimeout(id);
  }, [phase, correct, round, score]);

  const handleDrop = useCallback((zone, value) => {
    if (value < 1 || value > 10) return;
    setState(s => {
      if (s.phase !== 'drag') return s;
      if (zone === 'A' && s.num2 === value) return s;
      if (zone === 'B' && s.num1 === value) return s;
      return zone === 'A' ? { ...s, num1: value } : { ...s, num2: value };
    });
  }, []);

  const handleChoice = useCallback((choice) => {
    if (phase !== 'choose') return;
    setState(s => ({ ...s, selected: choice, correct: choice === s.num1 + s.num2, phase: 'result' }));
  }, [phase]);

  const restart = useCallback(() => setState(buildRound(1, 0)), []);

  // Mascot message + mood per phase
  let mascotContent, mascotMood;

  if (phase === 'done') {
    mascotContent = <span>Баяр хүргэе! Бүх бодлогыг амжилттай бодлоо! 🎉</span>;
    mascotMood = 'cheer';
  } else if (phase === 'result' && correct) {
    mascotContent = <span>Маш сайн! {num1} + {num2} = <strong>{num1 + num2}</strong> тийм зөв! ⭐</span>;
    mascotMood = 'cheer';
  } else if (phase === 'result' && !correct) {
    mascotContent = <span>Болохгүй байна! Дахин оролдоорой, чи чадна 💪</span>;
    mascotMood = 'think';
  } else if (phase === 'choose' && num1 !== null && num2 !== null) {
    mascotContent = (
      <>
        <span>{num1}-аас {num2}-ыг нэм:</span>
        <CountBubble num1={num1} num2={num2} />
        <span style={{ marginTop: 6 }}>Хариул нь хэд вэ?</span>
      </>
    );
    mascotMood = 'happy';
  } else if (num1 !== null || num2 !== null) {
    mascotContent = <span>Сайн байна! Одоо хоёр дахь тоог тавь.</span>;
    mascotMood = 'happy';
  } else {
    mascotContent = <span>Хоёр тоог чирж тавиарай!</span>;
    mascotMood = 'happy';
  }

  const choiceClass = (c) => {
    if (phase !== 'result') return 'choice-btn';
    if (c === num1 + num2) return 'choice-btn correct';
    if (c === selected)    return 'choice-btn wrong';
    return 'choice-btn';
  };

  const topbar = (
    <div className="lesson-topbar">
      <button className="lesson-back-btn" onClick={onBack} aria-label="Буцах">←</button>
      <span className="lesson-round-label">Бодлого {Math.min(round, TOTAL_ROUNDS)} / {TOTAL_ROUNDS}</span>
      <StarCounter score={score} />
    </div>
  );

  if (phase === 'done') {
    return (
      <div className="lesson-page">
        {topbar}
        <div className="completion-screen">
          <div className="completion-emoji">🎉</div>
          <h2>Баяр хүргэе!</h2>
          <p>Чи {score} / {TOTAL_ROUNDS} бодлогыг зөв бодлоо!</p>
          <div className="completion-stars">
            {[...Array(TOTAL_ROUNDS)].map((_, i) => (
              <span key={i}>{i < score ? '★' : '☆'}</span>
            ))}
          </div>
          <button className="replay-btn" onClick={restart}>Дахин тоглох →</button>
        </div>
      </div>
    );
  }

  return (
    <div className="lesson-page">
      {topbar}
      <div className="lesson-body">

        {/* Left: Mascot with contextual bubble */}
        <div className="lesson-left">
          <Mascot content={mascotContent} mood={mascotMood} />
        </div>

        {/* Center: equation + choices */}
        <div className="lesson-center">
          <div className="equation-row">
            <DropZone
              value={num1}
              color={num1 !== null ? COLORS[num1] : undefined}
              onDrop={(v) => handleDrop('A', v)}
              label="?"
            />
            <span className="op-sign">+</span>
            <DropZone
              value={num2}
              color={num2 !== null ? COLORS[num2] : undefined}
              onDrop={(v) => handleDrop('B', v)}
              label="?"
            />
            <span className="op-sign">=</span>
            <div className={`result-slot ${phase === 'result' && correct ? 'revealed' : ''}`}>
              {phase === 'result' && correct ? num1 + num2 : '?'}
            </div>
          </div>

          {/* Multiple-choice answers */}
          {phase !== 'drag' && (
            <div className="choices-grid">
              {choices.map((c) => (
                <button
                  key={c}
                  className={choiceClass(c)}
                  onClick={() => handleChoice(c)}
                  disabled={phase === 'result'}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: tile tray */}
        <div className="lesson-right">
          <div className="tile-tray-label">Тоонууд</div>
          <div className="tile-tray">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <DraggableTile
                key={n}
                value={n}
                color={COLORS[n]}
                disabled={n === num1 || n === num2 || phase !== 'drag'}
              />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
