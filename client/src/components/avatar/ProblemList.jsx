// Олон бодлоготой зураг ороход дугаарласан жагсаалт харуулна.
// Хүүхэд дарж (эсвэл дуугаар) аль бодлогоо бодохоо сонгоно.
// Бодогдсон бодлого дээр ✓ ба хариуг харуулна — бүгдийг бодсоны дараа
// хариу болон интерактивийг дахин харах (review) боломжтой.

const TYPE_ICON = {
  addition: '➕',
  subtraction: '➖',
  multiplication: '✖️',
  division: '➗',
  comparison: '⚖️',
  missing_addend: '🔲',
  number_sequence: '🔢',
  number_neighbor: '↔️',
  word: '📖',
  long_expression: '🧮',
  length_unit: '📏',
  tens_ones: '🔟',
  equation_balance: '🟰',
}

// Бодогдсон бодлогын хариуг товч, төрлийн дагуу уншигдахуйц болгож форматлана.
function formatAnswer(p) {
  const a = p?.answer
  if (a == null || a === '') return ''
  if (p.type === 'comparison') return a < 0 ? '<' : a > 0 ? '>' : '='
  if (p.type === 'length_unit' && Array.isArray(a) && a.length === 2) return `${a[0]} дм ${a[1]} см`
  if (Array.isArray(a)) return a.join(', ')
  return String(a)
}

export function ProblemList({ problems, selectedIndex, onSelect, solved = {}, title }) {
  if (!problems?.length) return null

  return (
    <div className="pl-root">
      <p className="pl-title">{title || 'Аль бодлогыг бодох вэ?'}</p>
      <div className="pl-grid">
        {problems.map((p, i) => {
          const done = !!solved[i]
          const answer = done ? formatAnswer(p) : ''
          return (
            <button
              key={i}
              type="button"
              className={`pl-item${selectedIndex === i ? ' pl-item-active' : ''}${done ? ' pl-item-done' : ''}`}
              onClick={() => onSelect(i)}
            >
              <span className="pl-num">{done ? '✓' : (p.index ?? i + 1)}</span>
              <span className="pl-icon">{TYPE_ICON[p.type] ?? '❓'}</span>
              <span className="pl-body">
                <span className="pl-text">{p.promptMn || p.raw}</span>
                {answer && <span className="pl-answer">Хариу: <b>{answer}</b></span>}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
