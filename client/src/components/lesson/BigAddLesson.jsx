import { useState, useEffect, useCallback, useRef } from 'react';
import './lesson.css';
import './big-add-lesson.css';
import { NumberVisual } from './NumberVisual.jsx';
import { Mascot } from './Mascot.jsx';
import { api } from '../../lib/api.js';

const TOTAL_ROUNDS = 5;

function newRoundNums() {
  let a, b;
  do {
    a = Math.floor(Math.random() * 45) + 1;
    b = Math.floor(Math.random() * 45) + 1;
  } while (a + b > 100 || a + b < 10);
  return [a, b];
}

function generateDistractors(answer) {
  const s = new Set();
  for (const d of [-5, -3, -2, 2, 3, 5, -1, 1, 10, -10, -4, 4]) {
    const v = answer + d;
    if (v >= 2 && v <= 100 && v !== answer) s.add(v);
    if (s.size >= 3) break;
  }
  return [...s].slice(0, 3);
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
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

function buildRound(round, score) {
  const [num1, num2] = newRoundNums();
  const answer = num1 + num2;
  const choices = shuffle([answer, ...generateDistractors(answer)]);
  return { round, score, num1, num2, choices, selected: null, phase: 'choose', correct: null };
}

export function BigAddLesson({ onBack, childId = 'guest' }) {
  const [state, setState] = useState(() => buildRound(1, 0));
  const { round, score, num1, num2, choices, selected, phase, correct } = state;
  const sessionRef = useRef(null);

  useEffect(() => {
    api.createSession({ childId, problem: 'Нэмэх (1-100)', skill: 'addition', difficulty: 'medium', correctAnswer: 0 })
      .then(d => { sessionRef.current = d.sessionId; })
      .catch(() => {});
  }, [childId]);

  useEffect(() => {
    if (phase !== 'result') return;
    const id = setTimeout(() => {
      if (correct) {
        const ns = score + 1;
        setState(round >= TOTAL_ROUNDS
          ? s => ({ ...s, score: ns, phase: 'done' })
          : buildRound(round + 1, ns));
      } else {
        setState(s => ({ ...s, selected: null, phase: 'choose', correct: null }));
      }
    }, 1400);
    return () => clearTimeout(id);
  }, [phase, correct, round, score]);

  const handleChoice = useCallback((c) => {
    if (phase !== 'choose') return;
    const ok = c === num1 + num2;
    setState(s => ({ ...s, selected: c, correct: ok, phase: 'result' }));
    if (sessionRef.current) {
      api.recordAttempt({
        sessionId: sessionRef.current, childId,
        skill: 'addition', answerGiven: String(c), isCorrect: ok,
      }).catch(() => {});
    }
  }, [phase, num1, num2, childId]);

  const restart = useCallback(() => {
    if (sessionRef.current) api.completeSession(sessionRef.current, true).catch(() => {});
    api.createSession({ childId, problem: 'Нэмэх (1-100)', skill: 'addition', difficulty: 'medium', correctAnswer: 0 })
      .then(d => { sessionRef.current = d.sessionId; })
      .catch(() => {});
    setState(buildRound(1, 0));
  }, [childId]);

  let mascotContent, mascotMood;
  if (phase === 'done') {
    mascotContent = <span>Баяр хүргэе! Бүх бодлогыг амжилттай бодлоо! 🎉</span>;
    mascotMood = 'cheer';
  } else if (phase === 'result' && correct) {
    mascotContent = <span>Маш сайн! {num1} + {num2} = <strong>{num1 + num2}</strong> зөв! ⭐</span>;
    mascotMood = 'cheer';
  } else if (phase === 'result' && !correct) {
    mascotContent = <span>Болохгүй байна! Дахин оролдоорой 💪</span>;
    mascotMood = 'think';
  } else {
    mascotContent = <span>{num1} + {num2} хэд болох вэ? Дүрсийг тоол!</span>;
    mascotMood = 'happy';
  }

  const choiceClass = (c) => {
    if (phase !== 'result') return 'choice-btn';
    if (c === num1 + num2) return 'choice-btn correct';
    if (c === selected) return 'choice-btn wrong';
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
            {[...Array(TOTAL_ROUNDS)].map((_, i) => <span key={i}>{i < score ? '★' : '☆'}</span>)}
          </div>
          <button className="replay-btn" onClick={restart}>Дахин тоглох →</button>
        </div>
      </div>
    );
  }

  return (
    <div className="lesson-page">
      {topbar}
      <div className="lesson-body bal-body">

        <div className="lesson-left">
          <Mascot content={mascotContent} mood={mascotMood} />
        </div>

        <div className="lesson-center">
          <div className="bal-eq-row">
            <NumberVisual value={num1} />
            <span className="op-sign">+</span>
            <NumberVisual value={num2} />
            <span className="op-sign">=</span>
            <div className={`result-slot bal-result${phase === 'result' && correct ? ' revealed' : ''}`}>
              {phase === 'result' && correct ? num1 + num2 : '?'}
            </div>
          </div>

          <div className="choices-grid bal-choices">
            {choices.map(c => (
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
        </div>

        <div className="lesson-right" />
      </div>
    </div>
  );
}
