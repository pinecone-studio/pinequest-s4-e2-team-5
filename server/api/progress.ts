import { Router } from "express";
import { MODELS, chatComplete } from "../lib/ai";
import { supabase } from "../lib/supabase";

const router = Router();


router.post("/session", async (req, res) => {
  const { childId, problem, skill, difficulty, correctAnswer } = req.body as {
    childId: string;
    problem: string;
    skill: string;
    difficulty: string;
    correctAnswer: number;
  };

  if (!childId || !problem) {
    res.status(400).json({ error: "childId болон problem шаардлагатай" });
    return;
  }

  const { data, error } = await supabase
    .from("sessions")
    .insert({
      child_id: childId,
      problem,
      skill,
      difficulty,
      correct_answer: correctAnswer,
    })
    .select("id")
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ sessionId: data.id });
});

// POST /api/progress/attempt
// Хүүхдийн хариулт бүрийг хадгална (зөв эсэхийг тэмдэглэнэ)
router.post("/attempt", async (req, res) => {
  const { sessionId, childId, skill, answerGiven, isCorrect } = req.body as {
    sessionId: string;
    childId: string;
    skill: string;
    answerGiven: string;
    isCorrect: boolean;
  };

  if (!sessionId || !childId) {
    res.status(400).json({ error: "sessionId болон childId шаардлагатай" });
    return;
  }

  const { error: attemptErr } = await supabase.from("attempts").insert({
    session_id: sessionId,
    child_id: childId,
    skill,
    answer_given: answerGiven,
    is_correct: isCorrect,
  });

  if (attemptErr) {
    res.status(500).json({ error: attemptErr.message });
    return;
  }

  // Сессийн оролдлогын тоог нэмэгдүүлнэ
  await supabase.rpc("increment_attempt_count", { session_id: sessionId });

  res.json({ ok: true });
});

// PATCH /api/progress/session/:id/complete
// Хүүхэд бодлогоо зөв бодоход сессийг дуусгана
router.patch("/session/:id/complete", async (req, res) => {
  const { id } = req.params;
  const { solved } = req.body as { solved: boolean };

  const { error } = await supabase
    .from("sessions")
    .update({ solved, completed_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ ok: true });
});

// GET /api/progress/:childId/analysis
// Хүүхдийн суул сэдвийн шинжилгээ + AI зөвлөгөө
router.get("/:childId/analysis", async (req, res) => {
  const { childId } = req.params;

  // Сүүлийн 30 хоногийн оролдлогуудыг авна
  const { data: attempts, error } = await supabase
    .from("attempts")
    .select("skill, is_correct, created_at")
    .eq("child_id", childId)
    .gte(
      "created_at",
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    )
    .order("created_at", { ascending: false });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  if (!attempts || attempts.length === 0) {
    res.json({
      weakTopics: [],
      strongTopics: [],
      aiInsight: "Одоохондоо мэдээлэл байхгүй байна.",
      totalAttempts: 0,
    });
    return;
  }

  // Сэдэв тус бүрийн зөв/буруу хариултыг тооцоолно
  const skillStats: Record<string, { correct: number; total: number }> = {};

  for (const attempt of attempts) {
    const skill = attempt.skill ?? "unknown";
    if (!skillStats[skill]) skillStats[skill] = { correct: 0, total: 0 };
    skillStats[skill].total++;
    if (attempt.is_correct) skillStats[skill].correct++;
  }

  const skillSummary = Object.entries(skillStats).map(([skill, s]) => ({
    skill,
    accuracy: Math.round((s.correct / s.total) * 100),
    total: s.total,
    correct: s.correct,
  }));

  const weakTopics = skillSummary
    .filter((s) => s.accuracy < 60)
    .sort((a, b) => a.accuracy - b.accuracy);

  const strongTopics = skillSummary
    .filter((s) => s.accuracy >= 80)
    .sort((a, b) => b.accuracy - a.accuracy);

  // AI-аар дүн шинжилгээ хийлгэнэ
  const aiResponse = await chatComplete({
    model: MODELS.chat,
    messages: [
      {
        role: "user",
        content: `Та бага ангийн математикийн мэргэжилтэн.
Хүүхдийн (ID: ${childId}) сүүлийн 30 хоногийн дасгалын үр дүн:

${skillSummary.map((s) => `- ${s.skill}: ${s.total} оролдлогоос ${s.correct} зөв (${s.accuracy}%)`).join("\n")}

Монгол хэлээр товч дүгнэлт бич:
1. Хамгийн сул сэдэв юу вэ, яагаад хэцүү байж болох вэ
2. Эцэг эхэд юу зөвлөх вэ (1-2 өгүүлбэр)
3. Дараагийн сессэд юуг анхаарах вэ

Зөвхөн энгийн текст, emoji хэрэглэж болно.`,
      },
    ],
    maxTokens: 1200,
    temperature: 0.7,
    reasoningEffort: "low",
  });

  const aiInsight =
    aiResponse.choices[0]?.message?.content ?? "Шинжилгээ хийж чадсангүй.";

  res.json({
    weakTopics,
    strongTopics,
    skillSummary,
    aiInsight,
    totalAttempts: attempts.length,
  });
});

export default router;
