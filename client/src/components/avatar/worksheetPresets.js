// Мэдэгдэж буй "Дасгал даалгавар" хуудсуудад зориулсан ТОГТМОЛ preset-ууд.
//
// Яагаад: зургийг OpenAI (analyze-homework) уншихдаа болгонд арай өөр raw/type/operands
// буцаадаг тул ижил хуудас оруулах бүрт интерактив нь өөр гарч, 1-р бодлого нь ялангуяа
// тогтворгүй байдаг. Хуудсыг таньж чадвал OpenAI-гаас үл хамааран ЯГ гар тааруулсан
// бодлогуудыг тогтмол дараалалд буцааж, интерактивыг найдвартай болгоно.
//
// Эдгээр объектууд normalizeHomeworkProblems-ийн дундуур дамжсан ч хэвээрээ үлддэг
// (тохирох төрөл + raw-тай) тул шууд зөв интерактив руу чиглэнэ.

// ── Хуудас #1: 40−5×7 / жиших / урт хэмжигдэхүүн / номын үгэн бодлого ──
function buildSheet1() {
  return [
    // 1. 40 − 5 × 7 =  → MinecraftFirstProblem (үржих → зээлж хасах)
    {
      index: 1,
      raw: '40 - 5 × 7 =',
      type: 'long_expression',
      operator: null,
      operands: [40, 5, 7],
      missingPosition: null,
      knownResult: null,
      answer: 5,
      promptMn: '40 − 5 × 7 = ? Эхлээд үржиж, дараа нь хас.',
    },
    // 2. 77 ? 57  → MinecraftCompare (аравт/нэгжээр жиших)
    {
      index: 2,
      raw: '77 ? 57',
      type: 'comparison',
      operator: null,
      operands: [77, 57],
      missingPosition: null,
      knownResult: null,
      answer: 1,
      promptMn: '77 ба 57-г жишээрэй.',
    },
    // 3. 9 + 5 ? 15  → MinecraftCompare (эхлээд 9+5-г бодоод жиших)
    {
      index: 3,
      raw: '9 + 5 ? 15',
      type: 'comparison',
      operator: null,
      operands: [14, 15],
      missingPosition: null,
      knownResult: null,
      answer: -1,
      promptMn: '9 + 5-г бодоод 15-тай жишээрэй.',
    },
    // 4. 5 дм = ? см  → MinecraftLengthOne (дм → см)
    {
      index: 4,
      raw: '5 дм = ? см',
      type: 'length_unit',
      operator: null,
      operands: [5],
      missingPosition: null,
      knownResult: null,
      answer: 50,
      promptMn: '5 дм хэдэн см болохыг ол (1 дм = 10 см).',
    },
    // 5. 35 см = ? дм ? см  → MinecraftLengthOne (задлах)
    {
      index: 5,
      raw: '35 см = ? дм ? см',
      type: 'length_unit',
      operator: null,
      operands: [35],
      missingPosition: null,
      knownResult: null,
      answer: [3, 5],
      promptMn: '35 см-ийг дм ба см болгон задал.',
    },
    // 6. Номын үгэн бодлого (5 + 6 = 11)  → MinecraftWordOne
    {
      index: 6,
      raw: 'Сумьяа өвлийн амралтаараа 5 ном уншив. Амгалан Сумьяагаас 6-аар олон ном уншив. Амгалан нийт хэдэн ном уншсан бэ?',
      type: 'word',
      operator: '+',
      operands: [5, 6],
      missingPosition: null,
      knownResult: null,
      answer: 11,
      promptMn: 'Амгалан нийт хэдэн ном уншсан бэ?',
    },
  ]
}

// Хуудсыг гарын үсгээр нь таних: тухайн хуудсанд ГАНЦ л байх тэмдэгүүдээр.
// #1 хуудас: "40 − 5 × 7" (эрэмбэт үйлдэл) БА урт хэмжигдэхүүн (дм/см) хоёул байвал
// энэ бол мэдэгдэж буй хуудас гэдэгт итгэлтэй байна.
function detectSheet1(text) {
  const hasOrderOfOps = /40\s*[-−]\s*5\s*[×xх*]\s*7/i.test(text)
  const hasLengthUnits = /дм/i.test(text) && /см/i.test(text)
  return hasOrderOfOps && hasLengthUnits
}

const PRESETS = [{ detect: detectSheet1, build: buildSheet1 }]

// Оруулсан бодлогууд мэдэгдэж буй хуудас мөн бол тогтмол preset-ийг, эс бол null буцаана.
export function applyWorksheetPresets(problems) {
  if (!Array.isArray(problems) || !problems.length) return null
  const text = problems
    .map((p) => `${p?.raw ?? ''} ${p?.promptMn ?? ''}`)
    .join(' ')
  for (const preset of PRESETS) {
    if (preset.detect(text)) return preset.build()
  }
  return null
}
