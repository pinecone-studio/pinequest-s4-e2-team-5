// Shared domino-tile number visual used by BigAddLesson and TutorAvatar

export const COLORS = {
  1: '#f2a36b', 2: '#f6cf69', 3: '#80b7c7', 4: '#6abf8e',
  5: '#f48fb1', 6: '#ce93d8', 7: '#ff8a65', 8: '#4db6ac',
  9: '#7986cb', 10: '#a5d6a7',
};

export const TEN_COLORS = [
  '#a5d6a7', '#80b7c7', '#f2a36b', '#f6cf69', '#f48fb1',
];

export const CELL_PATTERNS = {
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

export function StaticTile({ value, color, small }) {
  const rows = CELL_PATTERNS[value] || [];
  return (
    <div className={`domino-tile tile-static${small ? ' tile-sm' : ''}`}>
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

// Shows a number 1-100 as domino дүрс:
//   tens  → small 10-tiles stacked in a 3-column grid
//   ones  → regular-sized ones tile
export function NumberVisual({ value }) {
  const tens = Math.floor(value / 10);
  const ones = value % 10;
  return (
    <div className="num-visual">
      <div className="num-big-label">{value}</div>
      <div className="num-tiles">
        {tens > 0 && (
          <div className="tens-wrap">
            {[...Array(tens)].map((_, i) => (
              <StaticTile key={i} value={10} color={TEN_COLORS[i % TEN_COLORS.length]} small />
            ))}
          </div>
        )}
        {ones > 0 && (
          <StaticTile value={ones} color={COLORS[ones]} />
        )}
      </div>
    </div>
  );
}
