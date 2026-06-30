import { expect, test } from 'bun:test'
import { normalizeHomeworkProblems } from './problemNormalizer.js'

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
