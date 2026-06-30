function numbersFromText(value) {
  if (typeof value !== 'string') return []
  return value.match(/-?\d+/g)?.map(Number).filter(Number.isFinite) ?? []
}

function isBlankToken(value) {
  if (value === null || value === undefined) return true
  if (typeof value !== 'string') return false
  return /^(\s*|\.{2,}|…|_{1,}|□|▢|\?)$/.test(value)
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
  const tokens = raw.match(/-?\d+|\.{2,}|…|_{1,}|□|▢|\?/g) ?? []
  if (!tokens.some((token) => /\.{2,}|…|_{1,}|□|▢|\?/.test(token))) return []
  return normalizeSlots(tokens)
}

function hasSequenceCue(text) {
  return /дараал|цуваа|г[үу]йцээ|үргэлжлүүл|дараагийн|sequence|pattern|\.{2,}|…|_{1,}|□|▢|\?/i.test(text)
}

function hasNeighborCue(text) {
  return /х[өо]рш|өмн[өо]х|урд|хойно|neighbor|before|after|(?:тооны|тооныхоо)\s+дараах/i.test(text)
}

function isNeighborTarget(value) {
  return Number.isInteger(value) && value >= 1 && value <= 100
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

function normalizeNeighbor(problem, rawText, ops) {
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
    const completed = completeArithmeticSlots(slots)
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

    const neighbor = (out.type === 'number_neighbor' || hasNeighborCue(rawText))
      ? normalizeNeighbor(out, rawText, ops)
      : null
    if (neighbor) return neighbor

    const shouldSequence =
      out.type === 'number_sequence' ||
      hasSequenceCue(rawText) ||
      slotsFromRaw(out.raw).length > 0 ||
      (Array.isArray(out.sequenceSlots) && out.sequenceSlots.length > 0)
    const sequence = shouldSequence ? normalizeSequence(out, rawText, ops) : null
    return sequence ?? out
  })
}
