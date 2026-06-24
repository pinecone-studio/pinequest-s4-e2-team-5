import { expect, test } from 'bun:test'
import { getPageFromPath } from './navigation.js'

test('maps /learn to the learning page', () => {
  expect(getPageFromPath('/learn')).toBe('learn')
})

test('maps unknown paths to the home page', () => {
  expect(getPageFromPath('/')).toBe('home')
  expect(getPageFromPath('/anything')).toBe('home')
})
