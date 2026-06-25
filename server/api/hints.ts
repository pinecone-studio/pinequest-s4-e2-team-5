import { Router } from "express";
import OpenAI from "openai";
import { supabase } from "../lib/supabase";

const router = Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// POST /api/hints/hint
// DB-д байвал тэндээс авна, байхгүй бол AI-аар үүсгэж хадгална
router.post("/hint", async (req, res) => {
  const { skill, difficulty, strategy, wrongAnswer, problem } = req.body as {
    skill: string;
    difficulty: string;
    strategy?: string;
    wrongAnswer?: string;
    problem?: string;
  };

  if (!skill || !difficulty) {
    res.status(400).json({ error: "skill болон difficulty шаардлагатай" });
    return;
  }

  // 1. DB-ээс хайна
  const { data: existing } = await supabase
    .from("hints")
    .select("hint_text")
    .eq("skill", skill)
    .eq("difficulty", difficulty)
    .eq("strategy", strategy ?? "")
    .maybeSingle();

  if (existing) {
    res.json({ hint: existing.hint_text, source: "cache" });
    return;
  }

  // 2. DB-д байхгүй бол AI-аар үүсгэнэ
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: `Та 6-9 насны хүүхдэд математик заадаг найрсаг багш.

Сэдэв: ${skill} | Хэцүүлэг: ${difficulty} | Арга: ${strategy ?? "ерөнхий"}
${problem ? `Бодлого: ${problem}` : ""}
${wrongAnswer ? `Хүүхдийн буруу хариулт: ${wrongAnswer}` : ""}

Монгол хэлээр 1-2 өгүүлбэр зөвлөгөө бич:
- Яагаад буруу болсныг шууд хэлэхгүйгээр чиглүүл
- Энгийн, хүүхдэд ойлгомжтой жишээ ашигла
- Дуугаар унших тул emoji, тэмдэгт хэрэглэхгүй`,
      },
    ],
    max_tokens: 150,
    temperature: 0.7,
  });

  const hintText = completion.choices[0]?.message?.content ?? "";

  // 3. DB-д хадгална (дараа дахин ашиглана)
  await supabase.from("hints").insert({
    skill,
    difficulty,
    strategy: strategy ?? "",
    hint_text: hintText,
  });

  res.json({ hint: hintText, source: "ai" });
});

// POST /api/hints/practice
// skill+difficulty-д тохирох дасгалуудыг DB-ээс авна эсвэл AI-аар үүсгэнэ
router.post("/practice", async (req, res) => {
  const { skill, difficulty, count = 3 } = req.body as {
    skill: string;
    difficulty: string;
    count?: number;
  };

  if (!skill || !difficulty) {
    res.status(400).json({ error: "skill болон difficulty шаардлагатай" });
    return;
  }

  // 1. DB-ээс хайна (санамсаргүй дарааллаар)
  const { data: existing } = await supabase
    .from("practice_problems")
    .select("problem, answer")
    .eq("skill", skill)
    .eq("difficulty", difficulty)
    .limit(count * 3); // илүү авч, санамсаргүй сонгоно

  if (existing && existing.length >= count) {
    const shuffled = existing.sort(() => Math.random() - 0.5).slice(0, count);
    res.json({ problems: shuffled, source: "cache" });
    return;
  }

  // 2. AI-аар шинэ дасгалууд үүсгэнэ
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: `Сэдэв: ${skill} | Хэцүүлэг: ${difficulty}

6-9 насны хүүхдэд зориулсан ${count} дасгал бодлого үүсгэ.

Зөвхөн JSON буцаа:
{
  "problems": [
    { "problem": "7 + 4 = ?", "answer": 11 },
    ...
  ]
}`,
      },
    ],
    response_format: { type: "json_object" },
    max_tokens: 300,
    temperature: 0.9,
  });

  const parsed = JSON.parse(
    completion.choices[0]?.message?.content ?? '{"problems":[]}'
  );
  const problems: { problem: string; answer: number }[] =
    parsed.problems ?? [];

  // 3. DB-д хадгална
  if (problems.length > 0) {
    await supabase.from("practice_problems").insert(
      problems.map((p) => ({
        skill,
        difficulty,
        problem: p.problem,
        answer: p.answer,
      }))
    );
  }

  res.json({ problems, source: "ai" });
});

export default router;
