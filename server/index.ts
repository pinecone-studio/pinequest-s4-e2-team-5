import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
const port = process.env.PORT || 3000;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(cors());
app.use(express.json({ limit: "12mb" }));

app.get("/", (_req, res) => {
  res.json({ message: "PineQuest server ажиллаж байна! 🌲" });
});

// --- AI Tutor endpoints ---

app.post("/api/chat", async (req: any, res: any) => {
  const { nickname = "хүүхэд", homeworkContext = "", messages = [] } = req.body;

  const systemPrompt = `Чи бол "Нарс багш" — бага ангийн хүүхэдтэй ярьдаг найрсаг, тэвчээртэй математикийн AI багш. Чи хүүхэдтэй яг л дотны найз, хайрладаг багш шигээ дулаахан ярина.

Хүүхдийн нэр (nickname): ${nickname}
Одоогийн гэрийн даалгавар / бодлого: ${homeworkContext || "Одоогоор даалгавар оруулаагүй байна."}

ДҮРЭМ:
1. Хүүхдийг ҮРГЭЛЖ ${nickname}-ээр нь нэрлэж дууд.
2. Зөвхөн ОДООГИЙН гэрийн даалгавартай холбоотой л ярь. Хүүхэд даалгавартай холбоогүй өөр зүйл асуувал (тоглоом, кино, хувийн асуудал, аюултай зүйл г.м.) маш эелдэгээр ингэж хариул: "Уучлаарай ${nickname}, би энэ асуултад хариулж чадахгүй нь. Хоёулаа даалгавартаа эргэж орцгооё." Тэгээд бодлого руугаа эргэн ор.
3. Шууд хариуг ХЭЗЭЭ Ч битгий хэл. Алхам алхмаар, нэг удаад НЭГ жижиг асуултаар чиглүүл.
4. Бодлогыг тайлбарласны дараа ЗААВАЛ асуу: "${nickname}, чи энэ хэсгээс аль нь ойлгомжтой, аль нь ойлгомжгүй байна?" Хүүхэд ойлгомжгүй хэсгээ хэлвэл ЯГ ТЭР хэсгийг өөр үгээр, өөр энгийн жишээгээр ДАХИН тайлбарла.
5. Хүүхэд буруу хариулбал хэзээ ч битгий загна. "Ойролцоо боллоо, дахиад нэг хамт харъя" гэх мэт зөөлөн дэмжиж зас.
6. Хүүхэд зөв хариулбал чин сэтгэлээсээ магтаж урамшуул.
7. Бага ангийн хүүхдэд ойлгомжтой, маш энгийн, БОГИНО өгүүлбэр хэрэглэ. Урт яриа битгий хий — нэг хариуд 1-3 өгүүлбэр.
8. Чиний хариу ДУУ хоолойгоор уншигдана. Тиймээс байгалийн, дулаахан, ярианы хэлээр бич. Emoji, тусгай тэмдэгт, markdown, дугаарлал БҮҮ хэрэглэ — зөвхөн хүн ярьдаг шиг цэвэр өгүүлбэр.
9. +18, хүчирхийлэл, айдас төрүүлэх, аюултай ямар ч агуулга огт бүү дурд. Үргэлж эерэг, найрсаг, аюулгүй бай.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      temperature: 0.75,
      max_tokens: 200,
    });
    res.json({ text: completion.choices[0].message.content });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/tts", async (req: any, res: any) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "text required" });

  try {
    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: "nova",
      input: text,
      response_format: "mp3",
      speed: 0.95,
    });
    const buffer = Buffer.from(await mp3.arrayBuffer());
    res.set("Content-Type", "audio/mpeg");
    res.send(buffer);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/stt", async (req: any, res: any) => {
  const { audio, mimeType = "audio/webm" } = req.body;
  if (!audio) return res.status(400).json({ error: "audio required" });

  try {
    const buf = Buffer.from(audio, "base64");
    const ext = mimeType.includes("mp4") ? "mp4" : "webm";
    const file = new File([buf], `recording.${ext}`, { type: mimeType });
    const transcription = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
      language: "mn",
    });
    res.json({ text: transcription.text });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/analyze-homework", async (req: any, res: any) => {
  const { imageBase64, mimeType = "image/jpeg" } = req.body;
  if (!imageBase64) return res.status(400).json({ error: "imageBase64 required" });

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${imageBase64}` },
            },
            {
              type: "text",
              text: "Энэ зурган дээр ямар математикийн бодлого байгааг тайлбарла. Бодлогын бүх тоо, дүрс, текстийг монгол хэлээр нарийн тайлбарла. Зөвхөн бодлогын агуулгыг бич, өөр юу ч бүү нэм.",
            },
          ],
        },
      ],
      max_tokens: 600,
    });
    res.json({ context: response.choices[0].message.content });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(port, () => {
  console.log(`Server ${port} порт дээр ажиллаж байна`);
});