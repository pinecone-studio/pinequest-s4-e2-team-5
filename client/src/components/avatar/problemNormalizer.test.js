import { expect, test } from 'bun:test'
import { normalizeHomeworkProblems, parseLength } from './problemNormalizer.js'

test('parseLength: decompose / convert / to-dm', () => {
  expect(parseLength('26 = ... дм ... см')).toEqual({ mode: 'decompose', totalCm: 26, dm: 2, cm: 6 })
  expect(parseLength('2дм + 7см = ... см').answer).toBe(27)
  expect(parseLength('3дм = ... см').answer).toBe(30)
  expect(parseLength('40 см = ... дм').answer).toBe(4)
  expect(parseLength('5 + 3 = 8')).toBeNull()
})

test('normalizes neighbor numbers for every target from 1 to 100', () => {
  for (let n = 1; n <= 100; n++) {
    const [problem] = normalizeHomeworkProblems([
      { raw: `${n}-ын хөрш тоо`, type: 'word', operands: [n] },
    ])

    expect(problem.type).toBe('number_neighbor')
    expect(problem.neighborTarget).toBe(n)
    expect(problem.answer).toEqual([n - 1, n + 1])
  }
})

test('infers neighbor target from previous and next answers', () => {
  const [problem] = normalizeHomeworkProblems([
    { raw: 'өмнөх ба дараах тоог олоорой', type: 'word', answer: [54, 56] },
  ])

  expect(problem.type).toBe('number_neighbor')
  expect(problem.neighborTarget).toBe(55)
  expect(problem.answer).toEqual([54, 56])
})

test('normalizes arithmetic sequences with blanks in any position', () => {
  const problems = normalizeHomeworkProblems([
    { raw: '2, 4, 6, __, __', type: 'word', operands: [2, 4, 6] },
    { raw: '60, __, 64, 66', type: 'addition', operands: [60, 64, 66] },
    { raw: '__, 15, 20, 25', type: 'word' },
  ])

  expect(problems[0].type).toBe('number_sequence')
  expect(problems[0].answer).toEqual([8, 10])

  expect(problems[1].type).toBe('number_sequence')
  expect(problems[1].answer).toEqual([62])

  expect(problems[2].type).toBe('number_sequence')
  expect(problems[2].answer).toEqual([10])
})

test('does not turn a question-mark addition into a sequence', () => {
  const [problem] = normalizeHomeworkProblems([
    {
      raw: '3 + 1',
      promptMn: '3 дээр 1-г нэмбэл хэд болох вэ?',
      type: 'addition',
      operator: '+',
      operands: [3, 1],
      answer: 4,
    },
  ])

  expect(problem.type).toBe('addition')
  expect(problem.answer).toBe(4)
})

test('fills neighbor blanks by their actual position (not always prev+next)', () => {
  const cases = [
    { raw: '.... .... 95', slots: [null, null, 95], answer: [93, 94] },
    { raw: '47 .... ....', slots: [47, null, null], answer: [48, 49] },
    { raw: '.... 73 ....', slots: [null, 73, null], answer: [72, 74] },
    { raw: '83 .... ....', slots: [83, null, null], answer: [84, 85] },
  ]
  for (const c of cases) {
    const [problem] = normalizeHomeworkProblems([
      { raw: c.raw, type: 'number_neighbor', answer: [1, 2] },
    ])
    expect(problem.type).toBe('number_sequence')
    expect(problem.sequenceSlots).toEqual(c.slots)
    expect(problem.answer).toEqual(c.answer)
  }
})

test('keeps text-only neighbor questions symmetric (prev + next)', () => {
  const [problem] = normalizeHomeworkProblems([
    { raw: '5-ын хөрш тоо', type: 'number_neighbor', operands: [5] },
  ])
  expect(problem.type).toBe('number_neighbor')
  expect(problem.answer).toEqual([4, 6])
})

test('decomposes cm into dm and cm ("26 = ... дм ... см")', () => {
  const [problem] = normalizeHomeworkProblems([{ raw: '26 = ... дм ... см' }])
  expect(problem.type).toBe('length_unit')
})

test('converts dm + cm to total cm ("2дм + 7см = ... см")', () => {
  const [problem] = normalizeHomeworkProblems([{ raw: '2дм + 7см = ... см' }])
  expect(problem.type).toBe('length_unit')
})

test('routes parenthesized long expressions to long_expression', () => {
  for (const raw of ['7+4-(15+8)=', '2+3*(4-1)=', '(2+3)+(4+1)=']) {
    const [problem] = normalizeHomeworkProblems([{ raw }])
    expect(problem.type).toBe('long_expression')
  }
})

test('parses two-sided balance equations and solves the blank', () => {
  const cases = [
    { raw: '□-26=6+9', answer: 41 },
    { raw: '2+22=□-73', answer: 97 },
    { raw: '39+11=□+45', answer: 5 },
    { raw: '□-15=7+4', answer: 26 },
  ]
  for (const c of cases) {
    const [problem] = normalizeHomeworkProblems([{ raw: c.raw, type: 'missing_addend' }])
    expect(problem.type).toBe('equation_balance')
    expect(problem.answer).toBe(c.answer)
  }
})

test('leaves simple missing-addend (single known side) untouched', () => {
  const [problem] = normalizeHomeworkProblems([
    { raw: '5 + □ = 8', type: 'missing_addend', operands: [5], knownResult: 8, missingPosition: 1, answer: 3 },
  ])
  expect(problem.type).toBe('missing_addend')
})

test('keeps subtraction equations with a trailing blank as subtraction', () => {
  const [problem] = normalizeHomeworkProblems([
    { raw: '23 - 9 = ....', type: 'subtraction', operator: '-', operands: [23, 9], answer: 14 },
  ])
  expect(problem.type).toBe('subtraction')
  expect(problem.answer).toBe(14)
})

test('keeps addition equations with a blank result as addition', () => {
  const [problem] = normalizeHomeworkProblems([
    { raw: '5 + 3 = □', type: 'addition', operator: '+', operands: [5, 3], answer: 8 },
  ])
  expect(problem.type).toBe('addition')
})

test('normalizes tens and ones into [tens, ones]', () => {
  const [problem] = normalizeHomeworkProblems([
    { raw: '24-т хэдэн аравт хэдэн нэгж байна?', type: 'tens_ones', operands: [24] },
  ])

  expect(problem.type).toBe('tens_ones')
  expect(problem.answer).toEqual([2, 4])
})

test('detects abbreviated tens/ones form "28 = ... а ... н"', () => {
  const cases = [
    { raw: '28 = ... а ... н', answer: [2, 8] },
    { raw: '33 = ...а ...н', answer: [3, 3] },
    { raw: '91 = .. а .. н', answer: [9, 1] },
    { raw: '21= ..a ..н', answer: [2, 1] },
  ]
  for (const c of cases) {
    const [problem] = normalizeHomeworkProblems([{ raw: c.raw }])
    expect(problem.type).toBe('tens_ones')
    expect(problem.answer).toEqual(c.answer)
  }
})
