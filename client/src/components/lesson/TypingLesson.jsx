import { useState, useEffect, useCallback } from 'react';
import './lesson.css';
import './typing-lesson.css';
import { Mascot } from './Mascot.jsx';

const COLORS = {
  1: '#f2a36b', 2: '#f6cf69', 3: '#80b7c7',  4: '#6abf8e',
  5: '#f48fb1', 6: '#ce93d8', 7: '#ff8a65',  8: '#4db6ac',
  9: '#7986cb', 10: '#a5d6a7',
};

const CELL_PATTERNS = {
  1:  [[1,0]],
  2:  [[1,1]],
  3:  [[1,0],[1,1]],
  4:  [[1,1],[1,1]],
  5:  [[1,0],[1,1],[1,1]],
  6:  [[1,1],[1,1],[1,1]],
  7:  [[1,0],[1,1],[1,1],[1,1]],
  8:  [[1,1],[1,1],[1,1],[1,1]],
  9:  [[1,0],[1,1],[1,1],[1,1],[1,1]],
  10: [[1,1],[1,1],[1,1],[1,1],[1,1]],
};

const TOTAL_ROUNDS = 5;

function buildRound(round, score) {
  // num1 > num2 so result is always positive and within 1-9
  const answer = Math.floor(Math.random() * 9) + 1;   // 1–9
  const num2   = Math.floor(Math.random() * 9) + 1;   // 1–9
  const num1   = answer + num2;                        // 2–18, but we cap display at 10
  return { round, score, num1, num2, answer, selected: null, phase: 'pick', correct: null };
}

// Domino tile visual (read-only display)
function TileDisplay({ value }) {
  const rows = CELL_PATTERNS[value] || [];
  return (
    <div className="domino-tile" style={{ pointerEvents: 'none', cursor: 'default' }}>
      {rows.map((row, ri) =>
        row.map((filled, ci) => (
          <div
            key={`${ri}-${ci}`}
            className={filled ? 'domino-cell' : 'domino-cell empty'}
            style={filled ? { '--cell-color': COLORS[value] } : undefined}
          />
        ))
      )}
      <div className="domino-label">{value}</div>
    </div>
  );
}

// Clickable tile in the tray
function TileButton({ value, disabled, onClick }) {
  const rows = CELL_PATTERNS[value] || [];
  return (
    <div
      className={`domino-tile${disabled ? ' tile-disabled' : ''}`}
      onClick={!disabled ? () => onClick(value) : undefined}
      style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
    >
      {rows.map((row, ri) =>
        row.map((filled, ci) => (
          <div
            key={`${ri}-${ci}`}
            className={filled ? 'domino-cell' : 'domino-cell empty'}
            style={filled ? { '--cell-color': COLORS[value] } : undefined}
          />
        ))
      )}
      <div className="domino-label">{value}</div>
    </div>
  );
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

export function TypingLesson({ onBack }) {
  const [state, setState] = useState(() => buildRound(1, 0));
  const { round, score, num1, num2, answer, selected, phase, correct } = state;

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
        setState(s => ({ ...s, selected: null, phase: 'pick', correct: null }));
      }
    }, 1400);
    return () => clearTimeout(id);
  }, [phase, correct, round, score]);

  const handleTileClick = useCallback((value) => {
    if (phase !== 'pick') return;
    setState(s => ({
      ...s,
      selected: value,
      correct: value === s.answer,
      phase: 'result',
    }));
  }, [phase]);

  const restart = useCallback(() => setState(buildRound(1, 0)), []);

  // Mascot messages
  let mascotContent, mascotMood;

  if (phase === 'done') {
    mascotContent = <span>Баяр хүргэе! Бүх бодлогыг амжилттай бодлоо! 🎉</span>;
    mascotMood = 'cheer';
  } else if (phase === 'result' && correct) {
    mascotContent = <span>Маш сайн! {num1} − {num2} = <strong>{answer}</strong> зөв! ⭐</span>;
    mascotMood = 'cheer';
  } else if (phase === 'result' && !correct) {
    mascotContent = <span>{num1} − {num2} = {answer}. Дахин оролдоорой! 💪</span>;
    mascotMood = 'think';
  } else {
    mascotContent = <span>{num1} − {num2} = хэд вэ? Тоогоо дараарай!</span>;
    mascotMood = 'happy';
  }

  const resultSlotClass = [
    'result-slot',
    phase === 'result' && correct ? 'revealed' : '',
  ].filter(Boolean).join(' ');

  // Which tile in tray is in result-state
  const tileClass = (n) => {
    if (phase !== 'result') return '';
    if (n === answer)   return ' tile-correct';
    if (n === selected) return ' tile-wrong';
    return '';
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

        <div className="lesson-left">
          <Mascot content={mascotContent} mood={mascotMood} />
        </div>

        {/* Center: num1 − num2 = [?] */}
        <div className="typing-center">
          <div className="equation-row">
            {/* num1: shown as domino tile if ≤10, else plain number */}
            {num1 <= 10
              ? <div className="drop-zone filled typing-slot"><TileDisplay value={num1} /></div>
              : <div className="result-slot revealed" style={{ fontSize: 32 }}>{num1}</div>
            }
            <span className="op-sign">−</span>
            <div className="drop-zone filled typing-slot">
              <TileDisplay value={num2} />
            </div>
            <span className="op-sign">=</span>
            <div className={resultSlotClass}>
              {phase === 'result' ? answer : '?'}
            </div>
          </div>
        </div>

        {/* Right: clickable tile tray */}
        <div className="lesson-right">
          <div className="tile-tray-label">Тоонууд</div>
          <div className="tile-tray">
            {[1,2,3,4,5,6,7,8,9,10].map((n) => (
              <div key={n} className={`tile-wrap${tileClass(n)}`}>
                <TileButton
                  value={n}
                  disabled={phase !== 'pick'}
                  onClick={handleTileClick}
                />
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
