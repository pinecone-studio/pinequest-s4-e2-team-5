import { expect, test } from 'bun:test'
import { ROBOT_SCENE_URL } from './SplineScene.jsx'

test('uses the requested robot scene', () => {
  expect(ROBOT_SCENE_URL).toBe('https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode')
})
