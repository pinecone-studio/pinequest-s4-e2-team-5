function numbersFromText(value) {
  if (typeof value !== 'string') return []
  return value.match(/-?\d+/g)?.map(Number).filter(Number.isFinite) ?? []
}

// ── Тэнцэтгэл (Equation balance): "□-26=6+9", "2+22=□-73" гэх мэт ──
// Нэг талд дутуу тоо (□), нөгөө талд бүтэн илэрхийлэлтэй тэгшитгэлийг шинжилнэ.
const BALANCE_OP = { '+': '+', '-': '-', '−': '-', '*': '*', '×': '*', '/': '/', '÷': '/' }
const BALANCE_SYM = { '+': '+', '-': '−', '*': '×', '/': '÷' }
const BALANCE_BLANK = /(\.{2,}|…|□|▢|_+|\?)/

function evalBalanceSide(str) {
  const m = str.match(/^(-?\d+)\s*([+\-−*×/÷])\s*(-?\d+)$/)
  if (m) {
    const a = Number(m[1])
    const b = Number(m[3])
    const op = BALANCE_OP[m[2]]
    const value = op === '+' ? a + b : op === '-' ? a - b : op === '*' ? a * b : b !== 0 ? a / b : null
    if (value == null) return null
    return { value, tokens: [a, BALANCE_SYM[op], b], compound: true }
  }
  if (/^-?\d+$/.test(str)) return { value: Number(str), tokens: [Number(str)], compound: false }
  return null
}

function parseBalanceBlankSide(str) {
  const s = str.replace(BALANCE_BLANK, '@')
  let m = s.match(/^@\s*([+\-−*×/÷])\s*(-?\d+)$/)
  if (m) return { pos: 'left', op: BALANCE_OP[m[1]], num: Number(m[2]) }
  m = s.match(/^(-?\d+)\s*([+\-−*×/÷])\s*@$/)
  if (m) return { pos: 'right', op: BALANCE_OP[m[2]], num: Number(m[1]) }
  if (s === '@') return { pos: 'alone' }
  return null
}

function solveBalanceBlank(side, known) {
  if (side.pos === 'alone') return known
  const { op, num, pos } = side
  if (pos === 'left') {
    if (op === '+') return known - num
    if (op === '-') return known + num
    if (op === '*') return num !== 0 ? known / num : null
    if (op === '/') return known * num
  } else {
    if (op === '+') return known - num
    if (op === '-') return num - known
    if (op === '*') return num !== 0 ? known / num : null
    if (op === '/') return known !== 0 ? num / known : null
  }
  return null
}

// raw-г тэнцэтгэл гэж шинжилнэ. Нөгөө тал нь БҮТЭН илэрхийлэл (үйлдэлтэй) байвал
// л энэ бол balance — энгийн "5+□=8" (missing_addend)-ыг хөндөхгүй.
export function parseBalance(raw) {
  const s = String(raw ?? '').replace(/\s+/g, '')
  const parts = s.split('=')
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null
  const leftBlank = BALANCE_BLANK.test(parts[0])
  const rightBlank = BALANCE_BLANK.test(parts[1])
  if (leftBlank === rightBlank) return null // яг нэг талд □ байх ёстой

  const knownStr = leftBlank ? parts[1] : parts[0]
  const blankStr = leftBlank ? parts[0] : parts[1]
  const known = evalBalanceSide(knownStr)
  const blankSide = parseBalanceBlankSide(blankStr)
  // Тэнцэтгэл гэдэг нь ХОЁР тал илэрхийлэлтэй: битүү тал үйлдэлтэй (compound) ба
  // □-тэй тал нь ч бас үйлдэлтэй (alone биш). "5+3=□", "23-9=…" мэт дан хариуг
  // энд оруулахгүй — тэдгээр нь энгийн бодох бодлого.
  if (!known || !known.compound || !blankSide || blankSide.pos === 'alone') return null

  const answer = solveBalanceBlank(blankSide, known.value)
  if (answer == null || !Number.isInteger(answer) || answer < 0) return null

  return { leftBlank, blankSide, known, answer }
}

function isBlankToken(value) {
  if (value === null || value === undefined) return true
  if (typeof value !== 'string') return false
  return /^(\s*|\.{2,}|…|_{1,}|□|▢)$/.test(value)
}

function normalizeSlots(values) {
  return values.map((value) => {
    if (isBlankToken(value)) return null
    const n = Number(value)
    return Number.isFinite(n) ? n : null
  })
}

function slotsFromRaw(raw) {
  if (typeof raw !== 'string') return []
  const tokens = raw.match(/-?\d+|\.{2,}|…|_{1,}|□|▢/g) ?? []
  if (!tokens.some((token) => /\.{2,}|…|_{1,}|□|▢/.test(token))) return []
  return normalizeSlots(tokens)
}

function hasSequenceCue(text) {
  return /дараал|цуваа|г[үу]йцээ|үргэлжлүүл|дараагийн|sequence|pattern|\.{2,}|…|_{1,}|□|▢/i.test(text)
}

function hasNeighborCue(text) {
  return /х[өо]рш|өмн[өо]х|урд|хойно|neighbor|before|after|(?:тооны|тооныхоо)\s+дараах/i.test(text)
}

// "23 - 9 = ...." мэт тэгшитгэл/бодох бодлогыг дараалал гэж андуурахаас сэргийлнэ.
// Тэгш тэмдэг (=) эсвэл хоёр тооны хооронд үйлдлийн тэмдэг байвал энэ нь бодох
// бодлого — дараалал биш.
function looksLikeEquation(raw) {
  const s = String(raw ?? '')
  return /=/.test(s) || /\d\s*[+\-−×÷*/]\s*\d/.test(s)
}

// "7+4-(15+8)=" мэт хаалттай урт илэрхийлэл.
function hasLongExpression(raw) {
  const s = String(raw ?? '')
  return /\(/.test(s) && /\)/.test(s) && /\d/.test(s) && /[+\-−×÷*/]/.test(s)
}

function isNeighborTarget(value) {
  return Number.isInteger(value) && value >= 1 && value <= 100
}

function hasTensOnesCue(text) {
  return /аравт|нэгжийн орон|аравтын орон|орон[- ]?ны утга|tens?\s*(?:and|&)?\s*ones?/i.test(text)
}

// ── Урт хэмжигдэхүүн (см/дм): "26=...дм...см", "2дм+7см=...см" ──
// 1 дм = 10 см. Задлах эсвэл см/дм рүү хөрвүүлэх.
const LEN_UNIT = /(дм|dm|см|cm)/i
const LEN_BLANK = /(\.{2,}|…|□|▢|_+|\?)/

function lengthToCm(str) {
  const re = /(\d+)\s*(дм|dm|см|cm)?/gi
  let m
  let cm = 0
  let found = false
  const parts = []
  while ((m = re.exec(str)) !== null) {
    const n = Number(m[1])
    const unit = (m[2] || '').toLowerCase()
    const isDm = unit === 'дм' || unit === 'dm'
    cm += isDm ? n * 10 : n
    parts.push({ n, unit: isDm ? 'дм' : 'см' })
    found = true
  }
  return found ? { cm, parts } : null
}

export function parseLength(raw) {
  const s = String(raw ?? '').replace(/\s+/g, '')
  if (!LEN_UNIT.test(s)) return null
  const eq = s.split('=')
  if (eq.length !== 2 || !eq[0] || !eq[1]) return null
  const leftBlank = LEN_BLANK.test(eq[0])
  const rightBlank = LEN_BLANK.test(eq[1])
  if (leftBlank === rightBlank) return null

  const knownStr = leftBlank ? eq[1] : eq[0]
  const blankStr = leftBlank ? eq[0] : eq[1]
  const known = lengthToCm(knownStr)
  if (!known) return null

  const blankDm = /(дм|dm)/i.test(blankStr)
  const blankCm = /(см|cm)/i.test(blankStr)

  if (blankDm && blankCm) {
    return { mode: 'decompose', totalCm: known.cm, dm: Math.floor(known.cm / 10), cm: known.cm % 10 }
  }
  if (blankCm) {
    return { mode: 'convert', parts: known.parts, totalCm: known.cm, answer: known.cm, unit: 'см' }
  }
  if (blankDm) {
    if (known.cm % 10 !== 0) return null
    return { mode: 'convert', parts: known.parts, totalCm: known.cm, answer: known.cm / 10, unit: 'дм' }
  }
  return null
}

// "28 = ... а ... н" мэт товчилсон хэлбэр (а=аравт, н=нэгж) таних.
// = дараа хоосон нүд/цэг, дараа нь "а", дараа нь дахин хоосон, "н".
function hasTensOnesAbbrev(raw) {
  return /\d+\s*=[\s.…_□▢?]*[аa][\s.…_□▢?]+[нn]/i.test(String(raw ?? ''))
}

function normalizeTensOnes(problem, rawText, ops) {
  const answerNums = Array.isArray(problem.answer)
    ? problem.answer.map(Number).filter(Number.isFinite)
    : []
  let target = Number(ops[0])
  if (!Number.isFinite(target) && answerNums.length >= 2) {
    target = answerNums[0] * 10 + answerNums[1]
  }
  if (!Number.isFinite(target)) {
    target = numbersFromText(rawText).find((n) => n >= 10) ?? numbersFromText(rawText)[0]
  }
  if (!Number.isInteger(target) || target < 0 || target > 99) return null

  const tens = Math.floor(target / 10)
  const ones = target % 10
  return {
    ...problem,
    type: 'tens_ones',
    operator: null,
    operands: [target],
    missingPosition: null,
    knownResult: null,
    answer: [tens, ones],
    promptMn: problem.promptMn || `${target} тоо хэдэн аравт, хэдэн нэгжээс бүрдэх вэ?`,
  }
}

function completeArithmeticSlots(slots) {
  const known = slots
    .map((value, index) => ({ value, index }))
    .filter((item) => Number.isFinite(item.value))
  if (known.length < 2 || !slots.some((value) => value === null)) return null

  let step = null
  for (let i = 1; i < known.length; i++) {
    const gap = known[i].index - known[i - 1].index
    const diff = known[i].value - known[i - 1].value
    if (gap > 0 && diff % gap === 0) {
      step = diff / gap
      break
    }
  }
  if (step === null) return null

  const first = known[0].value - step * known[0].index
  const complete = slots.map((_, index) => first + step * index)
  const isConsistent = known.every(({ value, index }) => complete[index] === value)
  if (!isConsistent) return null

  const missingPositions = slots
    .map((value, index) => (value === null ? index : -1))
    .filter((index) => index >= 0)

  return {
    sequenceSlots: slots,
    missingPositions,
    missingPosition: missingPositions[0] ?? null,
    answer: missingPositions.map((index) => complete[index]),
    sequenceStep: step,
    answerCount: missingPositions.length,
  }
}

// Хоосон нүдтэй хөрш/дараалсан тоо (ж: "… … 95", "47 … …", "… 73 …").
// Ганц мэдэгдэх тоотой бол дараалсан тоо гэж үзэн step=1-ээр гүйцээнэ.
function completeConsecutiveSlots(slots) {
  const known = slots
    .map((value, index) => ({ value, index }))
    .filter((item) => Number.isFinite(item.value))
  if (!known.length || !slots.some((value) => value === null)) return null

  let step = 1
  if (known.length >= 2) {
    const gap = known[1].index - known[0].index
    const diff = known[1].value - known[0].value
    if (gap > 0 && diff % gap === 0) step = diff / gap
  }
  const first = known[0].value - step * known[0].index
  const complete = slots.map((_, index) => first + step * index)
  if (!known.every(({ value, index }) => complete[index] === value)) return null

  const missingPositions = slots
    .map((value, index) => (value === null ? index : -1))
    .filter((index) => index >= 0)
  return {
    sequenceSlots: slots,
    missingPositions,
    missingPosition: missingPositions[0] ?? null,
    answer: missingPositions.map((index) => complete[index]),
    sequenceStep: step,
    answerCount: missingPositions.length,
  }
}

function normalizeNeighbor(problem, rawText, ops) {
  // Бодлого дээр хоосон нүд (…) тодорхой байрлалтай бол тэр байрлалыг хадгалж,
  // дараалсан тоогоор гүйцээе — "Өмнөх/Дараах" гэж хоёр тал руу тарааж болохгүй.
  const rawSlots = looksLikeEquation(problem.raw) ? [] : slotsFromRaw(problem.raw)
  if (rawSlots.length) {
    const filled = completeConsecutiveSlots(rawSlots)
    if (filled) {
      return {
        ...problem,
        ...filled,
        type: 'number_sequence',
        operator: null,
        operands: rawSlots.filter((value) => Number.isFinite(value)),
        knownResult: null,
        // Байрлалыг харуулж байгаа тул "өмнөх/дараах" гэсэн эргэлзээтэй prompt-ыг
        // ашиглахгүй — хоосон нүдийг шууд харуулна.
        promptMn: `Хөрш тоог гүйцээгээрэй: ${filled.sequenceSlots
          .map((value) => (value == null ? '?' : value))
          .join(', ')}`,
      }
    }
  }

  const answerNums = Array.isArray(problem.answer)
    ? problem.answer.map(Number).filter(Number.isFinite)
    : []
  const rawNums = numbersFromText(rawText)
  let target = Number(problem.neighborTarget ?? ops[0])
  if (!Number.isFinite(target) && answerNums.length >= 2) {
    target = (answerNums[0] + answerNums[1]) / 2
  }
  if (!Number.isFinite(target) && rawNums.length === 1) {
    target = rawNums[0]
  }
  if (!isNeighborTarget(target)) return null

  return {
    ...problem,
    type: 'number_neighbor',
    operator: null,
    operands: [target],
    neighborTarget: target,
    missingPosition: null,
    knownResult: null,
    answer: [target - 1, target + 1],
    promptMn: problem.promptMn || `${target} тооны өмнөх ба дараах хөрш тоог олоорой.`,
  }
}

function normalizeSequence(problem, rawText, ops) {
  const rawSlots = slotsFromRaw(problem.raw)
  const slots = Array.isArray(problem.sequenceSlots) && problem.sequenceSlots.length
    ? normalizeSlots(problem.sequenceSlots)
    : rawSlots

  if (slots.length) {
    const completed = completeArithmeticSlots(slots) || completeConsecutiveSlots(slots)
    if (completed) {
      return {
        ...problem,
        ...completed,
        type: 'number_sequence',
        operator: null,
        operands: slots.filter((value) => Number.isFinite(value)),
        knownResult: null,
        promptMn: problem.promptMn || `${slots.map((value) => (value == null ? '?' : value)).join(', ')} дарааллыг гүйцээгээрэй.`,
      }
    }
  }

  const rawNums = numbersFromText(rawText)
  const shown = ops.length >= 2 ? ops : rawNums
  if (shown.length < 2) return null

  const step = shown[shown.length - 1] - shown[shown.length - 2]
  const isArithmetic = shown.length < 3 || shown.every((n, i) => i === 0 || n - shown[i - 1] === step)
  if (isArithmetic) {
    return {
      ...problem,
      type: 'number_sequence',
      operator: null,
      operands: shown,
      sequenceSlots: [...shown, null, null, null],
      missingPositions: [shown.length, shown.length + 1, shown.length + 2],
      missingPosition: shown.length,
      knownResult: null,
      answer: [1, 2, 3].map((i) => shown[shown.length - 1] + step * i),
      sequenceStep: step,
      answerCount: 3,
      promptMn: problem.promptMn || `${shown.join(', ')} дарааллын дараагийн 3 тоог олоорой.`,
    }
  }

  const prev = shown[shown.length - 2]
  const ratio = prev !== 0 ? shown[shown.length - 1] / prev : null
  const isGeometric =
    ratio !== null &&
    Number.isFinite(ratio) &&
    shown.every((n, i) => i === 0 || (shown[i - 1] !== 0 && n / shown[i - 1] === ratio))
  if (!isGeometric) return null

  return {
    ...problem,
    type: 'number_sequence',
    operator: null,
    operands: shown,
    sequenceSlots: [...shown, null, null, null],
    missingPositions: [shown.length, shown.length + 1, shown.length + 2],
    missingPosition: shown.length,
    knownResult: null,
    answer: [1, 2, 3].map((i) => shown[shown.length - 1] * ratio ** i),
    sequenceRatio: ratio,
    answerCount: 3,
    promptMn: problem.promptMn || `${shown.join(', ')} дарааллын дараагийн 3 тоог олоорой.`,
  }
}

export function normalizeHomeworkProblems(problems) {
  if (!Array.isArray(problems)) return []
  return problems.map((problem, index) => {
    const out = { ...problem, index: problem.index ?? index + 1 }
    const rawText = `${out.raw ?? ''} ${out.promptMn ?? ''}`
    const ops = Array.isArray(out.operands)
      ? out.operands.map(Number).filter(Number.isFinite)
      : []

    // Хаалттай урт илэрхийлэл (7+4-(15+8)=) — алхам алхмаар бодуулна.
    if (hasLongExpression(out.raw)) {
      return {
        ...out,
        type: 'long_expression',
        operator: null,
        promptMn: out.promptMn || 'Урт илэрхийллийг алхам алхмаар бодоорой.',
      }
    }

    // Урт хэмжигдэхүүн (см/дм): "26=...дм...см", "2дм+7см=...см"
    if (parseLength(out.raw)) {
      return {
        ...out,
        type: 'length_unit',
        operator: null,
        promptMn: out.promptMn || 'Урт хэмжигдэхүүнийг ол (1 дм = 10 см).',
      }
    }

    // Хоёр талдаа илэрхийлэлтэй тэнцэтгэл (□-26=6+9) — тусдаа interactive-т очно.
    const balance = parseBalance(out.raw)
    if (balance) {
      return {
        ...out,
        type: 'equation_balance',
        operator: null,
        answer: balance.answer,
        promptMn: out.promptMn || 'Тэнцэл гарахаар дутуу тоог сонгоорой.',
      }
    }

    const tensOnes = (out.type === 'tens_ones' || hasTensOnesCue(rawText) || hasTensOnesAbbrev(out.raw))
      ? normalizeTensOnes(out, rawText, ops)
      : null
    if (tensOnes) return tensOnes

    const neighbor = (out.type === 'number_neighbor' || hasNeighborCue(rawText))
      ? normalizeNeighbor(out, rawText, ops)
      : null
    if (neighbor) return neighbor

    const shouldSequence =
      out.type === 'number_sequence' ||
      (!looksLikeEquation(out.raw) && (
        hasSequenceCue(rawText) ||
        slotsFromRaw(out.raw).length > 0 ||
        (Array.isArray(out.sequenceSlots) && out.sequenceSlots.length > 0)
      ))
    const sequence = shouldSequence ? normalizeSequence(out, rawText, ops) : null
    return sequence ?? out
  })
}
