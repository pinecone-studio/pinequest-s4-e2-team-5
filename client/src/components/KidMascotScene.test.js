import { expect, test } from 'bun:test'
import { DEFAULT_MASCOT } from './mascotConfig.js'

test('uses the requested kid-friendly default mascot', () => {
  expect(DEFAULT_MASCOT).toEqual({
    id: 'sun-buddy',
    name: 'Нархан',
  })
})
