import { expect, test } from 'bun:test'
import { evalExpressionSteps } from './expressionSteps.js'

test('solves parentheses first, then left to right', () => {
  const r = evalExpressionSteps('7+4-(15+8)=')
  expect(r.steps.map((s) => [s.a, s.op, s.b, s.result])).toEqual([
    [15, '+', 8, 23],
    [7, '+', 4, 11],
    [11, '-', 23, -12],
  ])
  expect(r.finalValue).toBe(-12)
  expect(r.steps[0].inParen).toBe(true)
})

test('respects × ÷ precedence over + −', () => {
  const r = evalExpressionSteps('2+3*(4-1)=')
  expect(r.steps.map((s) => `${s.a}${s.op}${s.b}=${s.result}`)).toEqual([
    '4-1=3',
    '3*3=9',
    '2+9=11',
  ])
  expect(r.finalValue).toBe(11)
})

test('handles multiple parentheses groups', () => {
  expect(evalExpressionSteps('(2+3)+(4+1)=').finalValue).toBe(10)
})

test('returns null for a plain number (nothing to reduce)', () => {
  expect(evalExpressionSteps('42')).toBeNull()
})
