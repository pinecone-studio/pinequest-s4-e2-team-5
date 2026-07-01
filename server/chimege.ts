const CHIMEGE_SYNTHESIZE_URL = 'https://api.chimege.com/v1.2/synthesize'
type Fetcher = (request: Request) => Promise<Response>

export const GREETING_TEXT = 'Сайн байна уу'

export async function synthesizeMongolianSpeech(
  text: string,
  token: string,
  fetcher: Fetcher = fetch,
): Promise<Uint8Array> {
  const request = new Request(CHIMEGE_SYNTHESIZE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      Token: token,
      Speed: '0.92',
      Pitch: '1',
      'Sample-Rate': '22050',
    },
    body: text,
  })

  const response = await fetcher(request)
  if (!response.ok) {
    throw new Error(`CHIMEGE_TTS_FAILED:${response.status}`)
  }
  return new Uint8Array(await response.arrayBuffer())
}
