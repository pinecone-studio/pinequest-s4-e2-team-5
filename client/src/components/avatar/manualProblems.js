// OpenAI-гүйгээр (429 квот дуусах үед) бодлогуудыг ГАРААР бичиж оруулах локал задлагч.
// Мөр бүр = нэг бодлого. Дэмждэг хэлбэрүүд:
//   40 - 5 x 7 =            → урт илэрхийлэл (үржих эхэлж)
//   9 + 5 = , 12 - 4 =      → энгийн нэмэх/хасах/үржих/хуваах
//   77 ? 57 , 9+5 ? 15      → харьцуулах ( ? тэмдгээр )
//   5 дм = ? см             → урт хэмжигдэхүүн
//   35 см = ? дм ? см       → задлах
//   Сумьяа 5 ном... | 11    → үгэн бодлого ( | -ийн ард хариу )
import { evalExpressionSteps, tokenizeExpression } from './expressionSteps.js'
import { normalizeHomeworkProblems } from './problemNormalizer.js'

// x/х/X/·/∙ → *, ÷/: → /, −/– → -
function normalizeOps(s) {
  return String(s)
    .replace(/[×xхX·∙]/g, '*')
    .replace(/[÷]/g, '/')
    .replace(/[−–—]/g, '-')
}

// "= ?" , "=" , "= □" төгсгөлийг цэвэрлэнэ
function stripTrailingEquals(s) {
  return s.replace(/=\s*[?？.…_□▢\s]*$/u, '').trim()
}

function evalArith(expr) {
  const data = evalExpressionSteps(expr)
  return data ? data.finalValue : null
}

// Нэг мөрийг бодлогын объект болгоно (задлаж чадвал), эсвэл null.
function parseLine(line, index) {
  const [rawPart, ansPart] = line.split('|').map((s) => s.trim())
  const raw = rawPart
  const norm = normalizeOps(rawPart)

  // 1) Урт хэмжигдэхүүн (см/дм) — normalizer өөрөө таних тул зөвхөн raw дамжуулна
  if (/(дм|dm|см|cm)/i.test(raw) && /=/.test(raw)) {
    return { index, raw, promptMn: raw }
  }

  // 2) Харьцуулах:  ЗҮҮН ? БАРУУН  (тэнцэтгэлийн = биш, ? тэмдэг)
  if (norm.includes('?') && !norm.includes('=')) {
    const [l, r] = norm.split('?').map((s) => s.trim())
    const lv = /^-?\d+$/.test(l) ? Number(l) : evalArith(l)
    const rv = /^-?\d+$/.test(r) ? Number(r) : evalArith(r)
    if (lv != null && rv != null) {
      return {
        index,
        raw,
        type: 'comparison',
        operator: null,
        operands: [lv, rv],
        answer: lv < rv ? -1 : lv > rv ? 1 : 0,
        promptMn: `Аль нь их вэ? ${raw}`,
      }
    }
  }

  // 3) Тоон илэрхийлэл (нэмэх/хасах/үржих/хуваах, урт илэрхийлэл)
  const expr = stripTrailingEquals(norm)
  if (/^[\d+\-*/().\s]+$/.test(expr) && /\d/.test(expr)) {
    const answer = evalArith(expr)
    if (answer != null) {
      const tokens = tokenizeExpression(expr)
      const opCount = tokens.filter((t) => '+-*/'.includes(t)).length
      const hasParen = expr.includes('(')
      // Доод урсгал (LongExpressionInteractive) raw-аас дахин тооцдог тул стандарт
      // тэмдэгтээр (× ÷) хадгална — хэрэглэгч x/х/* аль нь ч бичсэн ажиллана.
      const cleanRaw = expr.replace(/\*/g, ' × ').replace(/\//g, ' ÷ ').replace(/\s+/g, ' ').trim() + ' ='
      // 2+ үйлдэл эсвэл хаалттай → урт илэрхийлэл (алхам алхмаар)
      if (opCount >= 2 || hasParen) {
        return { index, raw: cleanRaw, type: 'long_expression', operator: null, answer, promptMn: cleanRaw }
      }
      // Ганц үйлдэл → энгийн бодлого
      if (opCount === 1 && tokens.length === 3) {
        const [a, op, b] = tokens
        const typeByOp = { '+': 'addition', '-': 'subtraction', '*': 'multiplication', '/': 'division' }
        return {
          index,
          raw: cleanRaw,
          type: typeByOp[op],
          operator: op,
          operands: [Number(a), Number(b)],
          answer,
          promptMn: cleanRaw,
        }
      }
    }
  }

  // 4) Үгэн бодлого — хариуг | -ийн ард өгсөн байх ёстой
  const ans = Number(ansPart)
  if (Number.isFinite(ans)) {
    return { index, raw, type: 'word', operator: null, operands: [], answer: ans, promptMn: raw }
  }

  return null // задлаж чадсангүй
}

// Олон мөр текстийг бодлогын массив болгоно. { problems, skipped } буцаана.
export function parseManualProblems(text) {
  const lines = String(text ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  const problems = []
  const skipped = []
  lines.forEach((line) => {
    const p = parseLine(line, problems.length + 1)
    if (p) problems.push(p)
    else skipped.push(line)
  })

  return { problems: normalizeHomeworkProblems(problems), skipped }
}
