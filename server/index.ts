import express from "express";
import cors from "cors";
import WebSocket, { WebSocketServer } from "ws";
import progressRouter from "./api/progress";
import hintsRouter from "./api/hints";
import recordingsRouter from "./api/recordings";
import { normalizeForSpeech, sanitizeForChimegeTts } from "./lib/mn-speech";
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
  return process.env.CHIMEGE_TTS_API_KEY ?? process.env.CHIMEGE_API_KEY ?? "";
}

function getChimegeSttToken() {
  return (
    process.env.CHIMEGE_STT_API_KEY ??
    process.env.CHIMEGE_TTS_API_KEY ??
    process.env.CHIMEGE_API_KEY ??
    process.env.NEXT_PUBLIC_CHIMEGE_API_KEY ??
    ""
  );
}

app.use(cors());
app.use("/api/recordings", recordingsRouter);
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
3. Зөвхөн ОДООГИЙН гэрийн даалгавартай холбоотой л ярь. Хүүхэд даалгавартай хол보олгүй өөр зүйл асуувал (тоглоом, кино, хувийн асуудал, аюултай зүйл г.м.) ХЭЗЭЭ Ч татгалзаж, уучлал гуйж бүү хэл — "чадахгүй", "уучлаарай" гэж бүү хэл. Харин дулаахан, эерэгээр "${nickname}, одоо хоёулаа энэ бодлогоо хамт бодъё!" гэж даалгавар руугаа зөөлөн эргүүлж чиглүүл.
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
  const allMessages =
    messages.length === 0
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
    if (remaining.length <= maxLen) {
      chunks.push(remaining);
      break;
    }
    let cut = maxLen;
    for (let i = maxLen - 1; i > 0; i--) {
      if (".!?,".includes(remaining[i] ?? "")) {
        cut = i + 1;
        break;
      }
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
    const speech = sanitizeForChimegeTts(normalizeForSpeech(text));
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
          const errorText = await chimegeRes.text();
          console.error("❌ Chimege TTS failed:", chimegeRes.status, errorText);
          chimegeOk = false;
          break;
        }

        contentType = chimegeRes.headers.get("content-type") ?? contentType;
        audioBuffers.push(Buffer.from(await chimegeRes.arrayBuffer()));
      }

      if (chimegeOk && audioBuffers.length > 0) {
        const combined =
          audioBuffers.length === 1
            ? audioBuffers[0]!
            : Buffer.concat(audioBuffers);

        console.log("✅ Using Chimege TTS");
        res.set("Content-Type", contentType);
        return res.send(combined);
      }
    } else {
      console.warn(
        "⚠️ CHIMEGE_TTS_API_KEY байхгүй байна. OpenAI TTS ашиглана.",
      );
    }

    console.log("➡️ Falling back to OpenAI TTS");

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
    console.error("❌ TTS ERROR:", e);
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/stt", async (req: any, res: any) => {
  const { audio, mimeType = "audio/webm" } = req.body;
  if (!audio) return res.status(400).json({ error: "audio required" });

  try {
    const buf = Buffer.from(audio, "base64");

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

        console.log("========== CHIMEGE STT ==========");
        console.log("STT mimeType:", mimeType);
        console.log("STT audio size:", buf.length);
        console.log("STT status:", chimegeRes.status);
        console.log(
          "STT content-type:",
          chimegeRes.headers.get("content-type"),
        );

        if (chimegeRes.ok) {
          const ct = chimegeRes.headers.get("content-type") ?? "";
          const raw = await chimegeRes.text();

          console.log("Chimege STT raw:", raw);

          let text = "";

          if (ct.includes("application/json")) {
            try {
              const j = JSON.parse(raw);
              console.log("Parsed JSON:", j);
              text = j.text ?? j.result ?? j.transcript ?? "";
            } catch (err) {
              console.log("JSON parse failed:", err);
              text = raw;
            }
          } else {
            text = raw;
          }

          text = (text ?? "").trim();

          console.log("Final STT text:", text);

          if (text) {
            console.log("✅ Using Chimege STT");
            return res.json({ text });
          }

          console.warn(
            "⚠️ Chimege STT хоосон хариу өглөө. OpenAI STT руу шилжинэ.",
          );
        } else {
          const errorText = await chimegeRes.text();
          console.error("❌ Chimege STT failed:", chimegeRes.status, errorText);
        }
      } catch (chimegeErr) {
        console.error("❌ Chimege STT Exception:", chimegeErr);
      }
    } else {
      console.warn(
        "⚠️ CHIMEGE_STT_API_KEY байхгүй байна. OpenAI STT ашиглана.",
      );
    }

    console.log("➡️ Falling back to OpenAI STT");

    const ext = mimeType.includes("mp4") ? "mp4" : "webm";
    const file = new File([buf], `recording.${ext}`, { type: mimeType });

    const transcription = await openai.audio.transcriptions.create({
      file,
      model: MODELS.transcribe,
      prompt:
        "This audio is spoken in Mongolian. Transcribe exactly in Mongolian. Do not translate. Common words include: нэмэх, хасах, үржих, хуваах, тэнцүү, бодлого, хариу.",
    });

    res.json({ text: transcription.text });
  } catch (e: any) {
    console.error("❌ STT ERROR:", e);
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
- "number_sequence": тоон дарааллыг гүйцээх (ж: 2, 4, 6, __, __, __ эсвэл 60, __, 64, 66, 68). operands-д харагдаж буй тоонуудыг дарааллаар нь тавь. sequenceSlots-д бүх байрлалыг дарааллаар нь бичээд хоосон хэсгийг null болго (ж: [60,null,64,66,68]). missingPositions-д null байрлалуудын index-ийг тавь. answer-т бөглөх тоонуудыг массив хэлбэрээр тавь.
- "number_neighbor": нэг тооны хөрш тоог олох (ж: 5-ын хөрш тоо, 8 тооны өмнөх ба дараах). operands=[гол тоо], neighborTarget=гол тоо, answer=[өмнөх тоо, дараах тоо].
- "word": үгэн бодлого. operands-д тоонуудыг, operator-ийг (боломжтой бол), answer-т эцсийн хариуг.
- "tens_ones": тоог аравт ба нэгжийн оронд задлах (ж: 24 → 2 аравт 4 нэгж; "24-т хэдэн аравт, хэдэн нэгж байна?"). operands=[тоо], answer=[аравтын тоо, нэгжийн тоо].

Жишээ:
- Зураг дээр "2, 4, 6, __, __" байвал type="number_sequence", operands=[2,4,6], sequenceSlots=[2,4,6,null,null], answer=[8,10].
- Зураг дээр "60, __, 64, 66" байвал type="number_sequence", sequenceSlots=[60,null,64,66], answer=[62].
- Зураг дээр "5-ын хөрш тоо" эсвэл "5 тооны өмнөх ба дараах" байвал type="number_neighbor", operands=[5], neighborTarget=5, answer=[4,6].
- Зураг дээр "24-т хэдэн аравт хэдэн нэгж" эсвэл "аравт нэгж" байвал type="tens_ones", operands=[24], answer=[2,4].
- Хөрш тоо болон дараалал гүйцээхийг addition/subtraction гэж БҮҮ ангил.

Талбарууд:
- index: бодлогын дугаар (1-ээс эхэлнэ)
- raw: эх бичвэрийг яг хуулсан текст
- type: дээрх төрлийн нэг
- operator: "+" | "-" | "*" | "/" | null
- operands: мэдэгдэж буй тоонуудын массив
- missingPosition: null | 0 | 1 | 2
- sequenceSlots: number_sequence үед тоо болон null-тай массив (ж: [60,null,64,66,68])
- missingPositions: number_sequence үед хоосон байрлалуудын index массив
- neighborTarget: number_neighbor үед гол тоо
- knownResult: null | тоо
- answer: зөв хариу (хайж буй утга), тоо; number_sequence үед бөглөх тоонуудын массив; number_neighbor үед [өмнөх, дараах]; tens_ones үед [аравт, нэгж]
- promptMn: 6-9 насны хүүхдэд харагдах богино монгол асуулт
- explainMn: 2-4 богино монгол алхмын массив (хүүхдэд ойлгомжтой, шууд хариуг бүү хэл)`;

function extractSequenceSlotsFromRaw(raw: any): Array<number | null> {
  if (typeof raw !== "string") return [];
  const tokens = raw.match(/-?\d+|\.{2,}|…|_{1,}|□|▢/g) ?? [];
  if (!tokens.some((t) => /\.{2,}|…|_{1,}|□|▢/.test(t))) return [];
  return tokens.map((t) => (/^-?\d+$/.test(t) ? Number(t) : null));
}

function numbersFromText(value: any): number[] {
  if (typeof value !== "string") return [];
  return value.match(/-?\d+/g)?.map(Number).filter(Number.isFinite) ?? [];
}

function isBlankToken(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value !== "string") return false;
  return /^(\s*|\.{2,}|…|_{1,}|□|▢|\?)$/.test(value);
}

function normalizeSequenceSlotsValue(values: any[]): Array<number | null> {
  return values.map((value) => {
    if (isBlankToken(value)) return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  });
}

function hasNeighborCue(text: string): boolean {
  return /х[өо]рш|өмн[өо]х|урд|хойно|neighbor|before|after|(?:тооны|тооныхоо)\s+дараах/i.test(text);
}

function isNeighborTarget(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= 100;
}

function hasSequenceCue(text: string): boolean {
  return /дараал|цуваа|г[үу]йцээ|үргэлжлүүл|дараагийн|sequence|pattern|\.{2,}|…|_{1,}|□|▢/i.test(text);
}

// "23 - 9 = ...." мэт тэгшитгэл/бодох бодлогыг дараалал гэж андуурахаас сэргийлнэ.
function looksLikeEquation(raw: any): boolean {
  const s = String(raw ?? "");
  return /=/.test(s) || /\d\s*[+\-−×÷*/]\s*\d/.test(s);
}

// Тоон бодлогын answer-ийг operands-аас дахин тооцож баталгаажуулна (model алдааг засна).
function normalizeProblems(problems: any[]): any[] {
  if (!Array.isArray(problems)) return [];
  return problems.map((p, i) => {
    const out: any = { ...p, index: p.index ?? i + 1 };
    const ops = Array.isArray(out.operands) ? out.operands.map(Number) : [];
    const rawText = `${out.raw ?? ""} ${out.promptMn ?? ""}`;
    const rawNums = numbersFromText(rawText);
    const rawSequenceSlots = extractSequenceSlotsFromRaw(out.raw);
    const answerNums = Array.isArray(out.answer)
      ? out.answer.map(Number).filter(Number.isFinite)
      : [];

    if (out.type === "number_neighbor" || hasNeighborCue(rawText)) {
      let target = Number(out.neighborTarget ?? ops[0]);
      if (!Number.isFinite(target) && answerNums.length >= 2) {
        target = (answerNums[0] + answerNums[1]) / 2;
      }
      if (!Number.isFinite(target) && rawNums.length === 1) {
        target = rawNums[0];
      }
      if (isNeighborTarget(target)) {
        out.type = "number_neighbor";
        out.operands = [target];
        out.neighborTarget = target;
        out.answer = [target - 1, target + 1];
        out.operator = null;
        out.missingPosition = null;
        out.knownResult = null;
        out.promptMn = out.promptMn || `${target} тооны өмнөх ба дараах хөрш тоог олоорой.`;
        return out;
      }
    }

    if (ops.length === 2) {
      const [a, b] = ops;
      if (out.type === "addition") out.answer = a + b;
      else if (out.type === "subtraction") out.answer = a - b;
      else if (out.type === "multiplication") out.answer = a * b;
      else if (out.type === "division" && b !== 0) out.answer = a / b;
      else if (out.type === "comparison")
        out.answer = a < b ? -1 : a > b ? 1 : 0;
    }
    const shouldNormalizeSequence =
      out.type === "number_sequence" ||
      (!looksLikeEquation(out.raw) &&
        (rawSequenceSlots.length > 0 ||
          (hasSequenceCue(rawText) && (ops.length >= 2 || rawNums.length >= 2))));
    const sequenceOps = ops.length >= 2 ? ops : rawNums;
    if (shouldNormalizeSequence && (sequenceOps.length >= 2 || rawSequenceSlots.filter((v) => Number.isFinite(v)).length >= 2)) {
      const slots = Array.isArray(out.sequenceSlots)
        ? normalizeSequenceSlotsValue(out.sequenceSlots)
        : rawSequenceSlots;
      const knownSlots = slots
        .map((value: number | null, index: number) => ({ value, index }))
        .filter((item: any) => Number.isFinite(item.value));
      if (
        slots.length &&
        knownSlots.length >= 2 &&
        slots.some((v: number | null) => v === null)
      ) {
        let step: number | null = null;
        for (let idx = 1; idx < knownSlots.length; idx++) {
          const gap = knownSlots[idx].index - knownSlots[idx - 1].index;
          const diff = knownSlots[idx].value - knownSlots[idx - 1].value;
          if (gap > 0 && diff % gap === 0) {
            step = diff / gap;
            break;
          }
        }
        if (step !== null) {
          const first = knownSlots[0].value - step * knownSlots[0].index;
          const complete = slots.map(
            (_: any, idx: number) => first + step! * idx,
          );
          const isConsistent = knownSlots.every(
            (item: any) => complete[item.index] === item.value,
          );
          if (isConsistent) {
            out.type = "number_sequence";
            out.sequenceSlots = slots;
            out.missingPositions = slots
              .map((value: number | null, idx: number) =>
                value === null ? idx : -1,
              )
              .filter((idx: number) => idx >= 0);
            out.missingPosition = out.missingPositions[0] ?? null;
            out.answer = out.missingPositions.map(
              (idx: number) => complete[idx],
            );
            out.sequenceStep = step;
            out.answerCount = out.answer.length;
            out.operator = null;
            out.knownResult = null;
            out.operands = slots.filter((value: number | null) => Number.isFinite(value));
          }
        }
      } else {
        const step = ops[ops.length - 1] - ops[ops.length - 2];
        const isArithmetic =
          ops.length < 3 ||
          ops.every((n, idx) => idx === 0 || n - ops[idx - 1] === step);
        if (isArithmetic) {
          out.answer = [1, 2, 3].map((k) => ops[ops.length - 1] + step * k);
          out.sequenceSlots = [...ops, null, null, null];
          out.missingPositions = [ops.length, ops.length + 1, ops.length + 2];
          out.missingPosition = ops.length;
          out.sequenceStep = step;
          out.answerCount = 3;
        } else {
          const prev = ops[ops.length - 2];
          const ratio = prev !== 0 ? ops[ops.length - 1] / prev : null;
          const isGeometric =
            ratio !== null &&
            Number.isFinite(ratio) &&
            ops.every(
              (n, idx) =>
                idx === 0 || (ops[idx - 1] !== 0 && n / ops[idx - 1] === ratio),
            );
          if (isGeometric) {
            out.answer = [1, 2, 3].map((k) => ops[ops.length - 1] * ratio ** k);
            out.sequenceSlots = [...ops, null, null, null];
            out.missingPositions = [ops.length, ops.length + 1, ops.length + 2];
            out.missingPosition = ops.length;
            out.sequenceRatio = ratio;
            out.answerCount = 3;
          }
        }
      }
    }
    return out;
  });
}

function buildContextFromProblems(problems: any[]): string {
  return problems
    .map((p) => `${p.index}. ${p.raw ?? p.promptMn ?? ""}`)
    .join("\n");
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
{ "problems": [ { "index": 1, "raw": "...", "type": "...", "operator": "+", "operands": [5,3], "missingPosition": null, "sequenceSlots": null, "missingPositions": null, "neighborTarget": null, "knownResult": null, "answer": 8, "promptMn": "...", "explainMn": ["...","..."] } ] }

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

// POST /api/ai/analyze — бодлогыг шинжилж бүtéцтэй мэдээлэл гаргах
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
  "skill": "addition" | "subtraction" | "multiplication" | "division" | "comparison" | "number_sequence" | "number_neighbor",
  "type": "addition" | "subtraction" | "multiplication" | "division" | "comparison" | "missing_addend" | "number_sequence" | "number_neighbor" | "word" | "tens_ones",
  "operator": "+" | "-" | "*" | "/" | null,
  "operands": [мэдэгдэж буй тоонууд],
  "missingPosition": null | 0 | 1 | 2,
  "sequenceSlots": number_sequence үед [тоо, null, тоо] эсвэл null,
  "missingPositions": number_sequence үед [хоосон index] эсвэл null,
  "neighborTarget": number_neighbor үед гол тоо эсвэл null,
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
    return res
      .status(400)
      .json({ error: "problem болон analysis шаардлагатай" });

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

    const game = JSON.parse(response.choices[0]?.message?.content ?? "{}");
    res.json(game);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Parent monitoring: WebSocket room system (noServer mode — Bun compatible)
const rooms = new Map<string, { child: WebSocket | null; parents: Set<WebSocket> }>();
const wss = new WebSocketServer({ noServer: true });

wss.on("connection", (ws, req) => {
  const url = new URL(req.url!, "http://localhost");
  const code = url.searchParams.get("code");
  const role = url.searchParams.get("role");
  if (!code) { ws.close(); return; }

  console.log(`[WS] ${role?.toUpperCase()} холбогдлоо — код: ${code}`);

  if (!rooms.has(code)) rooms.set(code, { child: null, parents: new Set() });
  const room = rooms.get(code)!;

  if (role === "child") {
    room.child = ws;
    let frameCount = 0;
    ws.on("message", (data, isBinary) => {
      frameCount++;
      if (frameCount === 1) console.log(`[WS] Хүүхдийн frame ирж эхэллээ — код: ${code}`);
      for (const p of room.parents)
        if (p.readyState === WebSocket.OPEN) p.send(data, { binary: isBinary });
    });
    ws.on("close", () => {
      console.log(`[WS] CHILD салсан — код: ${code}`);
      room.child = null;
      for (const p of room.parents)
        if (p.readyState === WebSocket.OPEN)
          p.send(JSON.stringify({ type: "child-disconnected" }));
      if (room.parents.size === 0) rooms.delete(code);
    });
  } else {
    room.parents.add(ws);
    console.log(`[WS] Room ${code}: child=${room.child ? "байна" : "байхгүй"}, parents=${room.parents.size}`);
    if (room.child?.readyState === WebSocket.OPEN)
      room.child.send(JSON.stringify({ type: "parent-joined" }));
    ws.on("close", () => {
      console.log(`[WS] PARENT салсан — код: ${code}`);
      room.parents.delete(ws);
      if (!room.child && room.parents.size === 0) rooms.delete(code);
    });
  }
});

const httpServer = app.listen(port, "0.0.0.0", () => {
  console.log(`Server ${port} порт дээр ажиллаж байна`);
});

httpServer.on("upgrade", (req, socket, head) => {
  const url = new URL(req.url!, "http://localhost");
  if (url.pathname !== "/ws") {
    socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
    socket.destroy();
    return;
  }
  wss.handleUpgrade(req, socket as any, head, (ws) => {
    wss.emit("connection", ws, req);
  });
});
