// Олон бодлоготой зураг ороход дугаарласан жагсаалт харуулна.
// Хүүхэд дарж (эсвэл дуугаар) аль бодлогоо бодохоо сонгоно.

const TYPE_ICON = {
  addition: '➕',
  subtraction: '➖',
  multiplication: '✖️',
  division: '➗',
  comparison: '⚖️',
  missing_addend: '🔲',
  word: '📖',
}

export function ProblemList({ problems, selectedIndex, onSelect }) {
  if (!problems?.length) return null

  return (
    <div className="pl-root">
      <p className="pl-title">Аль бодлогыг бодох вэ?</p>
      <div className="pl-grid">
        {problems.map((p, i) => (
          <button
            key={i}
            type="button"
            className={`pl-item${selectedIndex === i ? ' pl-item-active' : ''}`}
            onClick={() => onSelect(i)}
          >
            <span className="pl-num">{p.index ?? i + 1}</span>
            <span className="pl-icon">{TYPE_ICON[p.type] ?? '❓'}</span>
            <span className="pl-text">{p.promptMn || p.raw}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
