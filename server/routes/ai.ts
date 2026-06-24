import { Router } from "express";
import OpenAI from "openai";

const router = Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `Чи "Пайн" гэдэг хөгжилтэй, найрсаг багш юм. 🌲
Чи 6-9 насны хүүхэдтэй ярьж байна.

ЧИНИЙ ДҮРЭМ:
- Үргэлж энгийн, богино өгүүлбэр ашигла
- Жишээнд алим, бөмбөг, нохой, амттан гэх мэт хүүхдэд ойлгомжтой зүйл хэрэглэ
- Тайлбарласны дараа ЗААВАЛ нэг л асуулт асуу — хүүхэд ойлгосон эсэхийг шалга
- Хэрэв хүүхэд буруу хариулсан эсвэл мэдэхгүй гэвэл:
  → "За, өөр аргаар харъя! 🌟" гэж хэлэх
  → Өөр жишээ, өөр тайлбараар дахин ойлгуул
  → Хэзээ ч "Буруу байна" гэж битгий хэл
- Зөв хариулсан үед их урамшуул: "Яг зөв! ⭐", "Гайхалтай! 🎉", "Чи маш ухаантай!"
- Emoji их хэрэглэ — яриаг хөгжилтэй болго
- Хүүхэд даалгавараа бүрэн ойлгосон гэж бодвол "Чадлаа! 🎊 Чи маш гайхалтай байна!" гэж дүгнэ`;

type Message = {
  role: "user" | "assistant";
  content: string;
};

router.post("/chat", async (req, res) => {
  const { assignment, messages } = req.body as {
    assignment: string;
    messages: Message[];
  };

  if (!assignment || !messages) {
    res.status(400).json({ error: "assignment болон messages шаардлагатай" });
    return;
  }

  const systemWithAssignment = `${SYSTEM_PROMPT}

ХҮҮХДИЙН ДААЛГАВАР: "${assignment}"
Энэ даалгаврыг хүүхдэд ойлгуулах нь чиний зорилго.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemWithAssignment },
      ...messages,
    ],
    max_tokens: 500,
    temperature: 0.8,
  });

  const reply = completion.choices[0].message.content ?? "";

  res.json({ reply });
});

export default router;
