import { expect, test } from 'bun:test'
import { GREETING_TEXT, synthesizeMongolianSpeech } from './chimege'

test('uses the requested short greeting', () => {
  expect(GREETING_TEXT).toBe('Сайн байна уу')
})

test('sends Mongolian text to Chimege without exposing the token in the body', async () => {
  let capturedRequest: Request | null = null
  const fakeFetch = async (request: Request) => {
    capturedRequest = request
    return new Response(new Uint8Array([82, 73, 70, 70]), { status: 200 })
  }

  const audio = await synthesizeMongolianSpeech('Сайн байна уу!', 'secret-token', fakeFetch)
  if (!capturedRequest) throw new Error('request was not captured')
  const request: Request = capturedRequest

  expect([...audio]).toEqual([82, 73, 70, 70])
  expect(request.url).toBe('https://api.chimege.com/v1.2/synthesize')
  expect(request.headers.get('token')).toBe('secret-token')
  expect(request.headers.get('content-type')).toContain('text/plain')
  expect(await request.text()).toBe('Сайн байна уу!')
})

test('throws a safe error when Chimege rejects the request', async () => {
  const fakeFetch = async () => new Response('Forbidden', { status: 403 })
  await expect(synthesizeMongolianSpeech('Сайн байна уу!', 'bad-token', fakeFetch)).rejects.toThrow('CHIMEGE_TTS_FAILED')
})
