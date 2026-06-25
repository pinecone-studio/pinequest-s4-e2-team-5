// Монгол хэлний яриа (TTS) бэлдэх нормализатор.
// Зорилго: Chimege рүү илгээхээс өмнө дижит ба математик тэмдгийг монгол ҮГЭНД
// хөрвүүлж, "31+3=" мэт зүйлийг "гучин нэг нэмэх гурав тэнцүү" болгож зөв уншуулах.

// Нэгж — бие даасан хэлбэр (өгүүлбэрийн төгсгөл / ганц зогсох үед)
const ONES = [
  "тэг", "нэг", "хоёр", "гурав", "дөрөв",
  "тав", "зургаа", "долоо", "найм", "ес",
];

// Нэгж — холбоот (attributive) хэлбэр (зуун/мянганы өмнө)
const ONES_ATTR = [
  "", "нэг", "хоёр", "гурван", "дөрвөн",
  "таван", "зургаан", "долоон", "найман", "есөн",
];

// Аравт — бие даасан хэлбэр (10, 20, ... 90)
const TENS = [
  "", "арав", "хорь", "гуч", "дөч",
  "тавь", "жар", "дал", "ная", "ер",
];

// Аравт — холбоот хэлбэр (ард нь нэгж дагах үед: гучин нэг)
const TENS_ATTR = [
  "", "арван", "хорин", "гучин", "дөчин",
  "тавин", "жаран", "далан", "наян", "ерэн",
];

// 0–9999 бүхэл тоог монгол үгэнд хөрвүүлнэ.
export function numberToMongolian(n: number): string {
  if (!Number.isFinite(n)) return String(n);
  if (n < 0) return "хасах " + numberToMongolian(-n);
  n = Math.floor(n);

  if (n < 10) return ONES[n]!;

  if (n < 100) {
    const t = Math.floor(n / 10);
    const o = n % 10;
    if (o === 0) return TENS[t]!;
    return `${TENS_ATTR[t]} ${ONES[o]}`;
  }

  if (n < 1000) {
    const h = Math.floor(n / 100);
    const rest = n % 100;
    const head = `${ONES_ATTR[h]} зуун`;
    return rest === 0 ? head : `${head} ${numberToMongolian(rest)}`;
  }

  if (n < 10000) {
    const th = Math.floor(n / 1000);
    const rest = n % 1000;
    const head = `${ONES_ATTR[th]} мянга`;
    return rest === 0 ? head : `${head} ${numberToMongolian(rest)}`;
  }

  // 10000-аас дээш ховор тохиолдол — цифр бүрчлэн уншина (буруу уншихаас сэргийлж)
  return String(n)
    .split("")
    .map((d) => ONES[Number(d)] ?? d)
    .join(" ");
}

// Текстийг ярианд бэлдэнэ: математик тэмдэг + дижитийг үгэнд хөрвүүлнэ.
export function normalizeForSpeech(text: string): string {
  if (!text) return "";

  let out = text;

  // 1) Дижитээр хүрээлэгдсэн тусгай тэмдэг (формат эвдэхгүйн тулд эхэлж)
  out = out.replace(/(\d)\s*\/\s*(\d)/g, "$1 хуваах $2");
  out = out.replace(/(\d)\s*\.\s*(\d)/g, "$1 цэг $2");

  // 2) Математик үйлдлийн тэмдгүүд
  out = out
    .replace(/[+]/g, " нэмэх ")
    .replace(/[-−–]/g, " хасах ")
    .replace(/[×*]/g, " үржих ")
    .replace(/[÷]/g, " хуваах ")
    .replace(/[=]/g, " тэнцүү ")
    .replace(/[%]/g, " хувь ");

  // 3) Үлдсэн дижит бүлгийг монгол үгэнд хөрвүүлэх
  out = out.replace(/\d+/g, (m) => numberToMongolian(Number(m)));

  // 4) Давхар зайг цэгцлэх
  out = out.replace(/\s+/g, " ").trim();

  return out;
}
