// Урт илэрхийллийг ("7 + 4 - (15 + 8) =") зөв дарааллаар алхам алхмаар задлана:
// хаалт доторхийг түрүүлж, дараа нь × ÷, эцэст нь + − (зүүнээс баруун).
const PREC = { '*': 2, '/': 2, '+': 1, '-': 1 }

function normOp(t) {
  return t === '−' ? '-' : t === '×' ? '*' : t === '÷' ? '/' : t
}

export function tokenizeExpression(s) {
  return (s.match(/\d+|[+\-−×÷*/()]/g) ?? []).map(normOp)
}

export function isNum(t) {
  return /^-?\d+$/.test(t)
}

function compute(a, op, b) {
  const x = Number(a)
  const y = Number(b)
  if (op === '+') return x + y
  if (op === '-') return x - y
  if (op === '*') return x * y
  if (op === '/') return y !== 0 ? x / y : null
  return null
}

// Хамгийн дотоод хаалтын [нээх, хаах] индекс
function innerParenRange(tokens) {
  let lp = -1
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i] === '(') lp = i
    else if (tokens[i] === ')') return [lp, i]
  }
  return null
}

// [lo..hi] мужид хамгийн эрэмбэ өндөр, зүүн талын үйлдлийн индекс
function findOpIndex(tokens, lo, hi) {
  let best = -1
  let bestPrec = 0
  for (let i = lo; i <= hi; i++) {
    const t = tokens[i]
    if (PREC[t] && isNum(tokens[i - 1] ?? '') && isNum(tokens[i + 1] ?? '')) {
      if (PREC[t] > bestPrec) { bestPrec = PREC[t]; best = i }
    }
  }
  return best
}

// (тоо) → тоо болгож илүүц хаалтыг цэвэрлэнэ
function stripSingleNumberParens(tokens) {
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i] === '(' && isNum(tokens[i + 1] ?? '') && tokens[i + 2] === ')') {
      tokens.splice(i + 2, 1)
      tokens.splice(i, 1)
      i -= 1
    }
  }
}

export function evalExpressionSteps(raw) {
  const cleaned = String(raw ?? '').replace(/=\s*[.?…_□▢\s]*$/, '').trim()
  const tokens = tokenizeExpression(cleaned)
  if (tokens.length < 3) return null

  const steps = []
  let guard = 0
  while (guard++ < 50) {
    stripSingleNumberParens(tokens)
    const paren = innerParenRange(tokens)
    const lo = paren ? paren[0] + 1 : 0
    const hi = paren ? paren[1] - 1 : tokens.length - 1
    const opIdx = findOpIndex(tokens, lo, hi)
    if (opIdx === -1) {
      if (paren) { tokens.splice(paren[1], 1); tokens.splice(paren[0], 1); continue }
      break
    }
    const a = tokens[opIdx - 1]
    const op = tokens[opIdx]
    const b = tokens[opIdx + 1]
    const result = compute(a, op, b)
    if (result == null || !Number.isFinite(result)) break

    steps.push({
      beforeTokens: [...tokens],
      hi: [opIdx - 1, opIdx, opIdx + 1],
      a: Number(a),
      op,
      b: Number(b),
      result,
      inParen: !!paren,
    })
    tokens.splice(opIdx - 1, 3, String(result))
  }

  stripSingleNumberParens(tokens)
  const finalValue = tokens.length === 1 && isNum(tokens[0]) ? Number(tokens[0]) : null
  if (!steps.length || finalValue == null) return null
  return { steps, finalValue }
}
