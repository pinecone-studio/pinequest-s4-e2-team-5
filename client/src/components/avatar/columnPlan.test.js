import { expect, test } from 'bun:test'
import { planColumns } from './columnPlan.js'

test('8 + 6 = 14 (single-digit, carry, one question)', () => {
  const p = planColumns(8, 6, '+')
  expect(p.answer).toBe(14)
  expect(p.hasTens).toBe(false)
  expect(p.steps).toHaveLength(1)
  expect(p.steps[0]).toMatchObject({ col: 'ones', ask: 14 })
})

test('12 - 2 = 10 (ones then tens)', () => {
  const p = planColumns(12, 2, '-')
  expect(p.answer).toBe(10)
  expect(p.hasTens).toBe(true)
  expect(p.steps.map((s) => s.ask)).toEqual([0, 1])
})

test('19 - 3 = 16', () => {
  const p = planColumns(19, 3, '-')
  expect(p.steps.map((s) => s.ask)).toEqual([6, 1])
})

test('25 + 17 = 42 (carry into tens)', () => {
  const p = planColumns(25, 17, '+')
  expect(p.answer).toBe(42)
  expect(p.steps[0].ask).toBe(12) // 5 + 7
  expect(p.steps[1]).toMatchObject({ carryIn: 1, ask: 4 }) // 2 + 1 + 1
})

test('12 - 5 = 7 (borrow)', () => {
  const p = planColumns(12, 5, '-')
  expect(p.answer).toBe(7)
  expect(p.steps[0]).toMatchObject({ borrow: 1, ask: 7 }) // 12 - 5
  expect(p.steps[1].ask).toBe(0) // (1-1) - 0
})
