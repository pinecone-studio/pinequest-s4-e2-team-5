import express from "express";
import cors from "cors";
import OpenAI from "openai";
import progressRouter from "./api/progress";
import hintsRouter from "./api/hints";

const app = express();
const port = process.env.PORT || 3000;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(cors());
app.use(express.json({ limit: "12mb" }));
app.use("/api/progress", progressRouter);
app.use("/api/hints", hintsRouter);

app.get("/", (_req, res) => {
  res.json({ message: "PineQuest server ажиллаж байна! 🌲" });
});

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
8. Чиний хариу ДУУ хоолойгоор уншигдана. Тиймээс байгалийн, дулаахан, ярианы хэлээр бич. Emoji, тусгай тэмдэгт, markdown, дугаарлал БҮҮ хэрэглэ — зөвхөн хүн ярьдаг шиг цэвэр өгүүлбэр. ТООГ ХЭЗЭЭ Ч ЦИФРЭЭР бичихгүй — заавал үгэнд хөрвүүлж бич. Жишээ нь: 315 → "гурван зуун арван тав", 114 → "нэг зуун арван дөрөв".
9. +18, хүчирхийлэл, айдас төрүүлэх, аюултай ямар ч агуулга огт бүү дурд. Үргэлж эерэг, найрсаг, аюулгүй бай.`;

  // messages хоосон үед анхны тайлбарыг эхлүүлэх trigger
  const allMessages = messages.length === 0
    ? [{ role: "user" as const, content: "Даалгаврыг тайлбарлаад эхэл." }]
    : messages;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: systemPrompt }, ...allMessages],
      temperature: 0.75,
      max_tokens: 200,
    });
    res.json({ text: completion.choices[0]?.message.content ?? "" });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

function splitIntoChunks(text: string, maxLen = 280): string[] {
  if (text.length <= maxLen) return [text];
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= maxLen) { chunks.push(remaining); break; }
    let cut = maxLen;
    for (let i = maxLen - 1; i > 0; i--) {
      if (".!?,".includes(remaining[i] ?? "")) { cut = i + 1; break; }
    }
    chunks.push(remaining.slice(0, cut).trim());
    remaining = remaining.slice(cut).trim();
  }
  return chunks.filter((c) => c.length > 0);
}

app.post("/api/tts", async (req: any, res: any) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "text required" });

  try {
    const chunks = splitIntoChunks(text);
    const audioBuffers: Buffer[] = [];

    let chimegeOk = true;
    for (const chunk of chunks) {
      const chimegeRes = await fetch("https://api.chimege.com/v1.2/synthesize", {
        method: "POST",
        headers: {
          "Content-Type": "text/plain",
          Token: process.env.NEXT_PUBLIC_CHIMEGE_API_KEY ?? "",
        },
        body: chunk,
      });
      if (!chimegeRes.ok) {
        chimegeOk = false;
        console.warn("Chimege unavailable, falling back to OpenAI TTS");
        break;
      }
      audioBuffers.push(Buffer.from(await chimegeRes.arrayBuffer()));
    }

    if (chimegeOk && audioBuffers.length > 0) {
      const combined = audioBuffers.length === 1 ? audioBuffers[0]! : Buffer.concat(audioBuffers);
      res.set("Content-Type", "audio/wav");
      return res.send(combined);
    }

    // Chimege ажиллахгүй бол OpenAI TTS fallback
    const mp3 = await openai.audio.speech.create({ model: "tts-1", voice: "nova", input: text });
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
  if (!imageBase64)
    return res.status(400).json({ error: "imageBase64 required" });

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
    res.json({ context: response.choices[0]?.message.content ?? "" });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/ai/analyze — бодлогыг шинжилж бүтэцтэй мэдээлэл гаргах
app.post("/api/ai/analyze", async (req: any, res: any) => {
  const { problem } = req.body;
  if (!problem) return res.status(400).json({ error: "problem шаардлагатай" });

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `Та бага ангийн математикийн мэргэжилтэн. Энэ бодлогыг 6-9 насны хүүхдэд зориулан шинжил.
Бодлого: "${problem}"

Зөвхөн JSON буцаа, тайлбар бүү нэм:
{
  "grade": анги (1-3 тоо),
  "skill": "addition" | "subtraction" | "multiplication" | "division" | "comparison",
  "strategy": бодох арга (жишээ: "make_ten", "count_on", "doubles", "split"),
  "difficulty": "easy" | "medium" | "hard",
  "commonMistake": хамгийн түгээмэл буруу хариулт (тоо),
  "correctAnswer": зөв хариулт (тоо),
  "steps": [монголоор, хүүхдэд ойлгомжтой алхмуудыг богино өгүүлбэрээр]
}`,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 400,
      temperature: 0.3,
    });

    const analysis = JSON.parse(
      response.choices[0]?.message?.content ?? "{}"
    );
    res.json(analysis);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/ai/generate-game — шинжилгээнд үндэслэн тоглоом үүсгэх
app.post("/api/ai/generate-game", async (req: any, res: any) => {
  const { problem, analysis } = req.body;
  if (!problem || !analysis)
    return res.status(400).json({ error: "problem болон analysis шаардлагатай" });

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `Та 6-9 насны хүүхдэд зориулсан интерактив математикийн тоглоом зохиодог.
Бодлого: "${problem}"
Шинжилгээ: ${JSON.stringify(analysis)}

Дараах scene-үүдээс хамгийн тохирохыг сонго:
- "battery_charge": тоо нэмэх → зай цэнэглэх (нэмэх бодлогод сайн)
- "space_collect": сансраас одон цуглуулах (нэмэх, хасах)
- "treasure_fill": эрдэнэсийн сав дүүргэх (нэмэх)
- "train_cars": галт тэргэнд вагон нэмэх (нэмэх, тоолох)
- "cookie_jar": жигнэмэг сав (хасах, хуваах)

Зөвхөн JSON буцаа:
{
  "scene": scene нэр,
  "goal": зорилго тайлбар (жишээ: "reach_13"),
  "targetNumber": эцсийн хариулт (тоо),
  "startNumber": эхний тоо,
  "addNumber": нэмэх/хасах тоо,
  "objects": [scene-д харагдах зүйлсийн нэрс],
  "voiceCharacter": "robot",
  "narration": {
    "intro": монголоор — робот тоглоомыг танилцуулна (1-2 өгүүлбэр, хөгжилтэй),
    "hint": монголоор — хүүхэд гацвал зөвлөгөө (1 өгүүлбэр),
    "success": монголоор — зөв хариулсан үед магтаал (1 өгүүлбэр)
  },
  "animationSteps": [
    { "action": "set" | "add" | "complete", "value": тоо, "label": монголоор тайлбар }
  ]
}`,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 600,
      temperature: 0.7,
    });

    const game = JSON.parse(
      response.choices[0]?.message?.content ?? "{}"
    );
    res.json(game);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(port, () => {
  console.log(`Server ${port} порт дээр ажиллаж байна`);
});
