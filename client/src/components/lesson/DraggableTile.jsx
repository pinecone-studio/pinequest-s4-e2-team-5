// 2-column cell grid: each row is [leftFilled, rightFilled]
// Odd numbers have a single cell on the left in the top row (indent)
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

export function DraggableTile({ value, color, disabled }) {
  const rows = CELL_PATTERNS[value] || [];

  return (
    <div
      className={`domino-tile ${disabled ? 'tile-disabled' : ''}`}
      draggable={!disabled}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', String(value));
        e.dataTransfer.effectAllowed = 'move';
      }}
    >
      {rows.map((row, ri) =>
        row.map((filled, ci) => (
          <div
            key={`${ri}-${ci}`}
            className={filled ? 'domino-cell' : 'domino-cell empty'}
            style={filled ? { '--cell-color': color } : undefined}
          />
        ))
      )}
      <div className="domino-label">{value}</div>
    </div>
  );
}
