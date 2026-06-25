// STT-ээс ирсэн монгол текстээс хүүхдийн нэрийг цэвэрлэж салгана.
// Жишээ: "Намайг Болд гэдэг" → "Болд", "Миний нэр Сараа" → "Сараа", "туяа" → "Туяа".

// Толгойд орших танилцуулгын үгс (нэрийн өмнө)
const LEADING = [
  "сайн байна уу",
  "сайн уу",
  "миний нэрийг",
  "миний нэр",
  "намайг",
  "минийг",
  "нэр нь",
  "нэр",
  "би бол",
  "би",
];

// Сүүлд орших туслах үгс (нэрийн ард)
const TRAILING = ["гэдэг юм", "гэдэг", "гэнэ", "байна юм", "байна"];

function capitalize(word) {
  if (!word) return word;
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export function extractName(rawText) {
  if (!rawText) return "";

  // Цэг таслал авч, зайг цэгцэлнэ
  let text = rawText
    .replace(/[.,!?;:"«»]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const lower = text.toLowerCase();
  const rawFirst = text.split(" ")[0] ?? "";

  let work = lower;

  // Толгойн үгсийг ар араас нь хасна
  let changed = true;
  while (changed) {
    changed = false;
    for (const phrase of LEADING) {
      if (work === phrase) {
        work = "";
        changed = true;
        break;
      }
      if (work.startsWith(phrase + " ")) {
        work = work.slice(phrase.length).trim();
        changed = true;
        break;
      }
    }
  }

  // Сүүлийн үгсийг хасна
  changed = true;
  while (changed) {
    changed = false;
    for (const phrase of TRAILING) {
      if (work === phrase) {
        work = "";
        changed = true;
        break;
      }
      if (work.endsWith(" " + phrase)) {
        work = work.slice(0, work.length - phrase.length).trim();
        changed = true;
        break;
      }
    }
  }

  const firstWord = work.split(" ").filter(Boolean)[0] ?? "";
  const result = firstWord || rawFirst;
  return capitalize(result).slice(0, 24);
}
