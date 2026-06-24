// Dice-style dot positions in a 3×3 grid (row 0-2, col 0-2)
const DOT_PATTERNS = {
  1: [[1,1]],
  2: [[0,2],[2,0]],
  3: [[0,2],[1,1],[2,0]],
  4: [[0,0],[0,2],[2,0],[2,2]],
  5: [[0,0],[0,2],[1,1],[2,0],[2,2]],
  6: [[0,0],[0,2],[1,0],[1,2],[2,0],[2,2]],
  7: [[0,0],[0,1],[0,2],[1,0],[1,2],[2,0],[2,2]],
  8: [[0,0],[0,1],[0,2],[1,0],[1,2],[2,0],[2,1],[2,2]],
  9: [[0,0],[0,1],[0,2],[1,0],[1,1],[1,2],[2,0],[2,1],[2,2]],
};

export function DraggableTile({ value, color, disabled, onDragStart, className = '' }) {
  const dots = DOT_PATTERNS[value] || [];

  // Build 3×3 grid cells — filled or empty
  const cells = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const filled = dots.some(([dr, dc]) => dr === r && dc === c);
      cells.push(<div key={`${r}-${c}`} className={filled ? 'dot' : ''} />);
    }
  }

  return (
    <div
      className={`draggable-tile ${disabled ? 'tile-disabled' : ''} ${className}`}
      style={{ background: color }}
      draggable={!disabled}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', String(value));
        e.dataTransfer.effectAllowed = 'move';
        onDragStart && onDragStart(value);
      }}
    >
      <div className="dot-grid">{cells}</div>
      <div className="tile-number">{value}</div>
    </div>
  );
}
