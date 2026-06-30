import express from "express";
import cors from "cors";
import progressRouter from "./api/progress";
import hintsRouter from "./api/hints";
import { normalizeForSpeech } from "./lib/mn-speech";
import { openai, MODELS, chatComplete } from "./lib/ai";

const app = express();
const port = Number(process.env.PORT) || 3010;
const chimegeTtsEndpoint =
  process.env.CHIMEGE_TTS_ENDPOINT ?? "https://api.chimege.com/v1.2/synthesize";
const chimegeSttEndpoint =
  process.env.CHIMEGE_STT_ENDPOINT ?? "https://api.chimege.com/v1.2/transcribe";

// TTS (synthesize) нь ТУСДАА токен шаарддаг. STT-only токеныг энд хэрэглэвэл
// хүсэлт бүрд 403 буцааж дэмий саатал үүсгэдэг тул зөвхөн TTS-д зориулсан түлхүүр авна.
// Chimege дуу хоолой идэвхжүүлэхийн тулд .env-д CHIMEGE_TTS_API_KEY=... нэмнэ.
function getChimegeTtsToken() {
  return (
    process.env.CHIMEGE_TTS_API_KEY ??
    process.env.CHIMEGE_API_KEY ??
    ""
  );
}

function getChimegeSttToken() {
  return (
    process.env.CHIMEGE_STT_API_KEY ??
    process.env.CHIMEGE_API_KEY ??
    process.env.NEXT_PUBLIC_CHIMEGE_API_KEY ??
    ""
  );
}

app.use(cors());
app.use(express.json({ limit: "12mb" }));
app.use("/api/progress", progressRouter);
app.use("/api/hints", hintsRouter);

app.get("/", (_req, res) => {
  res.json({ message: "PineQuest server ажиллаж байна! 🌲" });
});

app.post("/api/chat", async (req: any, res: any) => {
  const { nickname = "хүүхэд", homeworkContext = "", messages = [] } = req.body;

  const systemPrompt = `Чи бол "Жой багш" — 1-3 ангийн (6-9 настай) хүүхэдтэй ярьдаг найрсаг, тэвчээртэй математикийн AI багш. Чи хүүхэдтэй яг л дотны найз, хайрладаг багш шигээ дулаахан, тайван ярина.

Хүүхдийн нэр (nickname): ${nickname}
Одоогийн гэрийн даалгавар / бодлого: ${homeworkContext || "Одоогоор даалгавар оруулаагүй байна."}

ДҮРЭМ:
1. Хүүхдийг ҮРГЭЛЖ ${nickname}-ээр нь нэрлэж дууд.
2. Хүүхдийн ярьсан эсвэл бичсэн үгийг анхааралтай ойлго. Хэрэв сонсголт бүрхэг, үг дутуу, эсвэл ойлгомжгүй бол өөрийн дураар бүү тайлбарла — "${nickname}, чи дахиад нэг хэлээч?" гэж эелдэг асуу. Хүүхдийн ЯГ хэлсэн зүйлд тохирсон хариу өг.
3. Зөвхөн ОДООГИЙН гэрийн даалгавартай холбоотой л ярь. Хүүхэд даалгавартай холбоогүй өөр зүйл асуувал (тоглоом, кино, хувийн асуудал, аюултай зүйл г.м.) ХЭЗЭЭ Ч татгалзаж, уучлал гуйж бүү хэл — "чадахгүй", "уучлаарай" гэж бүү хэл. Харин дулаахан, эерэгээр "${nickname}, одоо хоёулаа энэ бодлогоо хамт бодъё!" гэж даалгавар руугаа зөөлөн эргүүлж чиглүүл.
4. Зургаар өгсөн даалгаврыг (дээрх "бодлого") тодорхой, алхам алхмаар тайлбарла. Юуны тухай бодлого болохыг хүүхдэд эхлээд энгийнээр танилцуул.
4a. Бодлогыг ДОТРОО АНГЛИАР бодож гүн ойлгосны дараа, маш энгийн монголоор хүүхдэд тайлбарла (англиар бүү бич). Бодлогын төрлийг таньж тохирох логикоор заа:
   - Нэмэх/хасах: тоонуудыг нийлүүлэх эсвэл хасах.
   - Үгэн бодлого: эхлээд ямар тоонууд байгаа, юу хийхийг (нэмэх үү, хасах уу) ялгаж ойлгуул.
   - Харьцуулах: аль тоо нь их/бага/тэнцүү болохыг асуу.
   - Нөхөх (жишээ: тав нэмэх хэд нь найм бэ): нэг тоо ба хариу нь өгөгдсөн үед хэдийг нэмэх/хасвал тэр хариу гарахыг олуулна.
4b. Хэрэв олон бодлого байгаа бөгөөд хүүхэд аль нэгийг сонгоогүй бол эхлээд "Аль бодлогыг хамт бодох вэ?" гэж эелдэг асуу. Хүүхэд бодлогын дугаар хэлвэл ЗӨВХӨН тэр бодлогыг авч үзэж, бусдыг нь бүү дурд.
5. Шууд хариуг ХЭЗЭЭ Ч битгий хэл. Алхам алхмаар, нэг удаад НЭГ жижиг асуултаар чиглүүл.
6. Бодлогыг тайлбарласны дараа ЗААВАЛ асуу: "${nickname}, чи энэ хэсгээс аль нь ойлгомжтой, аль нь ойлгомжгүй байна?" Хүүхэд ойлгомжгүй хэсгээ хэлвэл ЯГ ТЭР хэсгийг өөр үгээр, өөр энгийн жишээгээр (алим, бөмбөг, амттан г.м.) ДАХИН тайлбарла.
6a. Хүүхэд "ойлгохгүй байна", "яагаад ингэж байна", "юу гэсэн үг вэ", "дахиад хэлээд өгөөч", "яаж бодох вэ" гэх мэт асуувал — ОДООГИЙН бодлогыг өмнөхөөсөө ӨӨР, илүү энгийн үгээр, бодит жишээгээр (алим, бөмбөг, амттан г.м.) дахин тайлбарла. Хүүхдийн асуултад ШУУД, эелдэг, БОГИНО (нэг удаад 1-3 өгүүлбэр) хариул. Хариуг бүү бод, гэхдээ ойлгуулж чиглүүл.
7. Хүүхэд буруу хариулбал хэзээ ч битгий загна. "Ойролцоо боллоо, дахиад нэг хамт харъя" гэх мэт зөөлөн дэмжиж зас.
8. Хүүхэд зөв хариулбал чин сэтгэлээсээ магтаж урамшуул.
9. 1-3 ангийн хүүхдэд ойлгомжтой, маш энгийн, БОГИНО өгүүлбэр хэрэглэ. Урт яриа битгий хий — нэг хариуд 1-3 өгүүлбэр.
10. Чиний хариу ДУУ хоолойгоор уншигдана. Тиймээс байгалийн, дулаахан, ярианы хэлээр, ЦЭВЭР монголоор алдаагүй бич. Emoji, тусгай тэмдэгт, markdown, дугаарлал БҮҮ хэрэглэ — зөвхөн хүн ярьдаг шиг цэвэр өгүүлбэр. ТООГ ХЭЗЭЭ Ч ЦИФРЭЭР бичихгүй — заавал үгэнд хөрвүүлж бич. Жишээ нь: 315 → "гурван зуун арван тав", 114 → "нэг зуун арван дөрөв".
11. +18, хүчирхийлэл, айдас төрүүлэх, аюултай ямар ч агуулга огт бүү дурд. Үргэлж эерэг, найрсаг, аюулгүй бай.`;

  // messages хоосон үед анхны тайлбарыг эхлүүлэх trigger
  const allMessages = messages.length === 0
    ? [{ role: "user" as const, content: "Даалгаврыг тайлбарлаад эхэл." }]
    : messages;

  try {
    const completion = await chatComplete({
      model: MODELS.chat,
      messages: [{ role: "system", content: systemPrompt }, ...allMessages],
      temperature: 0.75,
      maxTokens: 1500,
      reasoningEffort: "low",
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
    // Дижит ба математик тэмдгийг монгол үгэнд хөрвүүлж байж л дуу болгоно.
    // (ж: "31+3=" → "гучин нэг нэмэх гурав тэнцүү"). Чанк хуваахаас ӨМНӨ хийнэ.
    const speech = normalizeForSpeech(text);
    const chunks = splitIntoChunks(speech);
    const audioBuffers: Buffer[] = [];
    const chimegeToken = getChimegeTtsToken();

    if (chimegeToken) {
      let chimegeOk = true;
      let contentType = "audio/wav";

      for (const chunk of chunks) {
        const chimegeRes = await fetch(chimegeTtsEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "text/plain",
            Token: chimegeToken,
          },
          body: chunk,
        });
        if (!chimegeRes.ok) {
          chimegeOk = false;
          console.warn("Chimege TTS unavailable, falling back to OpenAI TTS");
          break;
        }
        contentType = chimegeRes.headers.get("content-type") ?? contentType;
        audioBuffers.push(Buffer.from(await chimegeRes.arrayBuffer()));
      }

      if (chimegeOk && audioBuffers.length > 0) {
        const combined = audioBuffers.length === 1 ? audioBuffers[0]! : Buffer.concat(audioBuffers);
        res.set("Content-Type", contentType);
        return res.send(combined);
      }
    }

    // Chimege ажиллахгүй бол OpenAI TTS fallback (steerable gpt-4o-mini-tts).
    // instructions-ээр монгол хэлээр, орос/казах аялгагүй ярихыг чиглүүлнэ.
    const mp3 = await openai.audio.speech.create({
      model: MODELS.tts,
      voice: MODELS.ttsVoice as any,
      input: speech,
      instructions:
        "Дулаахан, тод, ойлгомжтой багшийн хоолой. Цэвэр монгол хэлээр, орос болон казах аялгагүйгээр, бага ангийн хүүхдэд зориулж тайван, элэгсэг ярь.",
    } as any);
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

    // 1) Эхлээд Chimege STT (монгол хэлэнд илүү тохиромжтой) оролдоно.
    const chimegeToken = getChimegeSttToken();
    if (chimegeToken) {
      try {
        const chimegeRes = await fetch(chimegeSttEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": mimeType,
            Token: chimegeToken,
          },
          body: buf,
        });
        if (chimegeRes.ok) {
          const ct = chimegeRes.headers.get("content-type") ?? "";
          const raw = await chimegeRes.text();
          // Chimege нь JSON эсвэл цэвэр текст буцааж болно.
          let text = "";
          if (ct.includes("application/json")) {
            try {
              const j = JSON.parse(raw);
              text = j.text ?? j.result ?? j.transcript ?? "";
            } catch {
              text = raw;
            }
          } else {
            text = raw;
          }
          text = (text ?? "").trim();
          if (text) return res.json({ text });
          console.warn("Chimege STT хоосон хариу, Whisper руу шилжиж байна");
        } else {
          console.warn(
            `Chimege STT боломжгүй (${chimegeRes.status}), Whisper руу шилжиж байна`,
          );
        }
      } catch (chimegeErr) {
        console.warn("Chimege STT алдаа, Whisper руу шилжиж байна:", chimegeErr);
      }
    }

    // 2) Chimege амжилтгүй / токенгүй бол OpenAI transcribe fallback.
    // gpt-4o-transcribe + монгол prompt-оор хазайлгаснаар казах/орос мэт буруу таихыг багасгана.
    const ext = mimeType.includes("mp4") ? "mp4" : "webm";
    const file = new File([buf], `recording.${ext}`, { type: mimeType });
    const transcription = await openai.audio.transcriptions.create({
      file,
      model: MODELS.transcribe,
      language: "mn",
      prompt:
        "Энэ бол монгол хэлний яриа. Бага ангийн математикийн хичээл: нэмэх, хасах, үржих, хуваах, тэнцүү, тоо, бодлого, хариу.",
    });
    res.json({ text: transcription.text });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Зургийн бодлогуудыг бүтэцтэй болгох нийтлэг JSON схемийн заавар.
// /api/analyze-homework болон /api/ai/analyze хоёул энэ форматыг ашиглана.
const PROBLEM_SCHEMA_INSTRUCTION = `Бодлого бүрийг доорх схемээр дүрсэл. Дотроо англиар бод (reason in English) — гэхдээ зөвхөн JSON-г л буцаа.

Төрлүүд (type):
- "addition": a + b
- "subtraction": a - b
- "multiplication": a * b
- "division": a / b
- "comparison": хоёр тоог харьцуул (a ? b). operands=[a,b], answer: a<b бол -1, a=b бол 0, a>b бол 1.
- "missing_addend": хоосон нүдтэй (ж: 5 + _ = 8, эсвэл _ - 3 = 4). operator-ийг тавь; мэдэгдэж буй тоонуудыг operands-д (зүүнээс баруун дараалал); хоосон нүдний байрлалыг missingPosition (0=эхний тоо, 1=хоёр дахь тоо, 2=хариу); "=" дараах тоог knownResult-д (мэдэгдэж байвал); answer-т хайж буй хоосон утгыг тавь.
- "word": үгэн бодлого. operands-д тоонуудыг, operator-ийг (боломжтой бол), answer-т эцсийн хариуг.

Талбарууд:
- index: бодлогын дугаар (1-ээс эхэлнэ)
- raw: эх бичвэрийг яг хуулсан текст
- type: дээрх төрлийн нэг
- operator: "+" | "-" | "*" | "/" | null
- operands: мэдэгдэж буй тоонуудын массив
- missingPosition: null | 0 | 1 | 2
- knownResult: null | тоо
- answer: зөв хариу (хайж буй утга), тоо
- promptMn: 6-9 насны хүүхдэд харагдах богино монгол асуулт
- explainMn: 2-4 богино монгол алхмын массив (хүүхдэд ойлгомжтой, шууд хариуг бүү хэл)`;

// Тоон бодлогын answer-ийг operands-аас дахин тооцож баталгаажуулна (model алдааг засна).
function normalizeProblems(problems: any[]): any[] {
  if (!Array.isArray(problems)) return [];
  return problems.map((p, i) => {
    const out: any = { ...p, index: p.index ?? i + 1 };
    const ops = Array.isArray(out.operands) ? out.operands.map(Number) : [];
    if (ops.length === 2) {
      const [a, b] = ops;
      if (out.type === "addition") out.answer = a + b;
      else if (out.type === "subtraction") out.answer = a - b;
      else if (out.type === "multiplication") out.answer = a * b;
      else if (out.type === "division" && b !== 0) out.answer = a / b;
      else if (out.type === "comparison") out.answer = a < b ? -1 : a > b ? 1 : 0;
    }
    return out;
  });
}

function buildContextFromProblems(problems: any[]): string {
  return problems.map((p) => `${p.index}. ${p.raw ?? p.promptMn ?? ""}`).join("\n");
}

app.post("/api/analyze-homework", async (req: any, res: any) => {
  const { imageBase64, mimeType = "image/jpeg" } = req.body;
  if (!imageBase64)
    return res.status(400).json({ error: "imageBase64 required" });

  try {
    const response = await chatComplete({
      model: MODELS.vision,
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
              text: `Чи бол 1-3 ангийн математикийн багш. Энэ зураг дээрх БҮХ бодлогыг алгасалгүй, дээрээс доош, зүүнээс баруун тийш дугаарласан дарааллаар нь нягт уншиж шинжил.

${PROBLEM_SCHEMA_INSTRUCTION}

Зөвхөн дараах JSON-г буцаа, өөр юу ч бүү нэм:
{ "problems": [ { "index": 1, "raw": "...", "type": "...", "operator": "+", "operands": [5,3], "missingPosition": null, "knownResult": null, "answer": 8, "promptMn": "...", "explainMn": ["...","..."] } ] }

Зураг дээр бодлого огт байхгүй бол { "problems": [] } буцаа.`,
            },
          ],
        },
      ],
      jsonMode: true,
      maxTokens: 4000,
      reasoningEffort: "minimal",
    });

    const parsed = JSON.parse(response.choices[0]?.message?.content ?? "{}");
    const problems = normalizeProblems(parsed.problems ?? []);
    res.json({ problems, context: buildContextFromProblems(problems) });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/ai/analyze — бодлогыг шинжилж бүтэцтэй мэдээлэл гаргах
app.post("/api/ai/analyze", async (req: any, res: any) => {
  const { problem } = req.body;
  if (!problem) return res.status(400).json({ error: "problem шаардлагатай" });

  try {
    const response = await chatComplete({
      model: MODELS.chat,
      messages: [
        {
          role: "user",
          content: `Та бага ангийн математикийн мэргэжилтэн. Энэ бодлогыг 6-9 насны хүүхдэд зориулан шинжил.
Бодлого: "${problem}"

${PROBLEM_SCHEMA_INSTRUCTION}

Зөвхөн дараах JSON-г буцаа, тайлбар бүү нэм:
{
  "index": 1,
  "raw": "${problem}",
  "grade": анги (1-3 тоо),
  "skill": "addition" | "subtraction" | "multiplication" | "division" | "comparison",
  "type": "addition" | "subtraction" | "multiplication" | "division" | "comparison" | "missing_addend" | "word",
  "operator": "+" | "-" | "*" | "/" | null,
  "operands": [мэдэгдэж буй тоонууд],
  "missingPosition": null | 0 | 1 | 2,
  "knownResult": null | тоо,
  "strategy": бодох арга (жишээ: "make_ten", "count_on", "doubles", "split"),
  "difficulty": "easy" | "medium" | "hard",
  "commonMistake": хамгийн түгээмэл буруу хариулт (тоо),
  "correctAnswer": зөв хариулт (тоо),
  "answer": зөв хариулт (тоо),
  "promptMn": хүүхдэд харагдах богино монгол асуулт,
  "explainMn": [монголоор, хүүхдэд ойлгомжтой алхмуудыг богино өгүүлбэрээр],
  "steps": [монголоор, хүүхдэд ойлгомжтой алхмуудыг богино өгүүлбэрээр]
}`,
        },
      ],
      jsonMode: true,
      maxTokens: 2000,
      temperature: 0.3,
      reasoningEffort: "low",
    });

    const raw = JSON.parse(response.choices[0]?.message?.content ?? "{}");
    const [analysis] = normalizeProblems([raw]);
    // skill талбарыг type-аас нөхөж, хариуг correctAnswer/answer хоёуланд нийцүүлнэ.
    if (!analysis.skill && analysis.type) analysis.skill = analysis.type;
    if (analysis.answer == null && analysis.correctAnswer != null)
      analysis.answer = analysis.correctAnswer;
    if (analysis.correctAnswer == null && analysis.answer != null)
      analysis.correctAnswer = analysis.answer;
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
    const response = await chatComplete({
      model: MODELS.chat,
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
      jsonMode: true,
      maxTokens: 2000,
      temperature: 0.7,
      reasoningEffort: "low",
    });

    const game = JSON.parse(
      response.choices[0]?.message?.content ?? "{}"
    );
    res.json(game);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Server ${port} порт дээр ажиллаж байна`);
});
