import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MascotScene } from '../KidMascotScene.jsx'
import { useTutor } from './useTutor.js'
import { NumberVisual, COLORS } from '../lesson/NumberVisual.jsx'
import { MulDivInteractive } from './MulDivInteractive.jsx'
import { ColumnMathInteractive } from './ColumnMathInteractive.jsx'
import { ComparisonInteractive } from './ComparisonInteractive.jsx'
import { MissingAddendInteractive } from './MissingAddendInteractive.jsx'
import { NumberSequenceInteractive } from './NumberSequenceInteractive.jsx'
import { NeighborNumberInteractive } from './NeighborNumberInteractive.jsx'
import { WordProblemInteractive } from './WordProblemInteractive.jsx'
import { TensOnesInteractive } from './TensOnesInteractive.jsx'
import { EquationBalanceInteractive } from './EquationBalanceInteractive.jsx'
import { LongExpressionInteractive } from './LongExpressionInteractive.jsx'
import { MinecraftFirstProblem } from './MinecraftFirstProblem.jsx'
import { MinecraftCompare } from './MinecraftCompare.jsx'
import { MinecraftLengthOne } from './MinecraftLengthOne.jsx'
import { MinecraftWordOne } from './MinecraftWordOne.jsx'
import { extractStory } from './mcUtils.js'
import { tokenizeExpression } from './expressionSteps.js'
import { ProblemList } from './ProblemList.jsx'
import { CelebrationBurst } from './CelebrationBurst.jsx'
import { JoyBackground, JoyRobot } from './JoyScene.jsx'
import { MinecraftBackground } from './MinecraftScene.jsx'
import { MinecraftSteveScene } from './MinecraftSteveScene.jsx'
import { McQueenBackground } from './McQueenScene.jsx'
import AstronautLoader from './AstronautLoader.jsx'
import './astronaut-loader.css'
import { extractProblemNumber } from './extractProblemNumber.js'
import { normalizeHomeworkProblems } from './problemNormalizer.js'
import '../lesson/lesson.css'
import '../lesson/big-add-lesson.css'

// Хүүхдийн дуут асуулт/тусламжийн хүсэлт — эдгээрийг бодлого сонголт гэж үзэхгүй,
// шууд chat руу дамжуулж AI дахин тайлбарлана.
const HELP_RE = /ойлгох|ойлгом|мэдэхг|яагаад|яаж|юу гэс|юу вэ|юу гэ|дахиад|дахин|хэлээ|хэлэхг|туслаач|ойлгуул|алхам|болохг|бодож өг/

// Хариултын карт бүрийг тооныхоо өнгөөр (чихэр блок загвар) будна.
const numColor = (n) => COLORS[n] ?? COLORS[((Math.abs(n) - 1) % 10) + 1] ?? '#7e8bff'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function makeChoices(answer) {
  const set = new Set([answer])
  for (const d of [-3, -2, -1, 1, 2, 3, 4, -4]) {
    const v = answer + d
    if (v >= 0) set.add(v)
    if (set.size >= 3) break
  }
  return shuffle([...set].slice(0, 3))
}

/* ── parseMath: structured problems байхгүй үед (хуучин нэг текст) fallback ── */
function parseMath(ctx) {
  if (!ctx) return null
  let m = ctx.match(/(\d+)\s*[+]\s*(\d+)/)
  if (!m) m = ctx.match(/(\d+)\s*нэмэх\s*(\d+)/i)
  if (m) return { a: parseInt(m[1]), b: parseInt(m[2]), op: '+' }
  let s = ctx.match(/(\d+)\s*[-−]\s*(\d+)/)
  if (!s) s = ctx.match(/(\d+)\s*хасах\s*(\d+)/i)
  if (s) return { a: parseInt(s[1]), b: parseInt(s[2]), op: '-' }
  return null
}

function makeNeighborProblem(n, raw) {
  return {
    index: 1,
    raw,
    type: 'number_neighbor',
    operator: null,
    operands: [n],
    neighborTarget: n,
    missingPosition: null,
    knownResult: null,
    answer: [n - 1, n + 1],
    promptMn: `${n} тооны өмнөх ба дараах хөрш тоог олоорой.`,
  }
}

function parseNeighbor(ctx) {
  if (!ctx) return null
  const nums = ctx.match(/-?\d+/g)?.map(Number) ?? []
  if (nums.length !== 1) return null
  const n = nums[0]
  if (!Number.isInteger(n) || n < 1 || n > 100) return null
  const hasNeighborWord =
    /х[өо]рш|өмн[өо]х|урд|хойно|neighbor|hursh|h[öo]rsh|(?:тооны|тооныхоо)\s+дараах/i.test(ctx)
  const onlyNumber = /^-?\d+$/.test(ctx.trim())
  if (!hasNeighborWord && !onlyNumber) return null
  return makeNeighborProblem(n, ctx)
}

function parseSequence(ctx) {
  if (!ctx) return null
  const nums = ctx.match(/-?\d+/g)?.map(Number) ?? []
  const tokenMatches = ctx.match(/-?\d+|\.{2,}|…|_{1,}|□|▢|\?/g) ?? []
  const hasBlank = tokenMatches.some((t) => /\.{2,}|…|_{1,}|□|▢|\?/.test(t))

  if (hasBlank) {
    const slots = tokenMatches.map((t) => (/^-?\d+$/.test(t) ? Number(t) : null))
    const known = slots
      .map((value, index) => ({ value, index }))
      .filter((item) => Number.isFinite(item.value))
    if (known.length >= 2 && slots.some((value) => value === null)) {
      let step = null
      for (let i = 1; i < known.length; i++) {
        const gap = known[i].index - known[i - 1].index
        const diff = known[i].value - known[i - 1].value
        if (gap > 0 && diff % gap === 0) {
          step = diff / gap
          break
        }
      }
      if (step !== null) {
        const first = known[0].value - step * known[0].index
        const complete = slots.map((_, i) => first + step * i)
        const isConsistent = known.every(({ value, index }) => complete[index] === value)
        if (isConsistent) {
          const missingPositions = slots
            .map((value, index) => (value === null ? index : -1))
            .filter((index) => index >= 0)
          const answer = missingPositions.map((index) => complete[index])
          return {
            index: 1,
            raw: ctx,
            type: 'number_sequence',
            operator: null,
            operands: slots.filter((value) => Number.isFinite(value)),
            sequenceSlots: slots,
            missingPositions,
            missingPosition: missingPositions[0] ?? null,
            knownResult: null,
            answer,
            sequenceStep: step,
            answerCount: answer.length,
            promptMn: `${slots.map((v) => (v == null ? '?' : v)).join(', ')} дарааллыг гүйцээгээрэй.`,
          }
        }
      }
    }
  }

  const looksLikeSequence =
    /дараал|дараагийн|дараах|г[үу]йцээ|үргэлжлүүл/i.test(ctx) ||
    (nums.length >= 3 && /[,;\s]\s*-?\d+\s*[,;\s]/.test(ctx))
  if (!looksLikeSequence || nums.length < 2) return null
  const step = nums[nums.length - 1] - nums[nums.length - 2]
  const isArithmetic = nums.length < 3 || nums.every((n, i) => i === 0 || n - nums[i - 1] === step)
  if (isArithmetic) {
    return {
      index: 1,
      raw: ctx,
      type: 'number_sequence',
      operator: null,
      operands: nums,
      sequenceSlots: [...nums, null, null, null],
      missingPositions: [nums.length, nums.length + 1, nums.length + 2],
      missingPosition: nums.length,
      knownResult: null,
      answer: [1, 2, 3].map((i) => nums[nums.length - 1] + step * i),
      sequenceStep: step,
      answerCount: 3,
      promptMn: `${nums.join(', ')} дарааллын дараагийн 3 тоог олоорой.`,
    }
  }

  const ratio = nums[nums.length - 2] !== 0 ? nums[nums.length - 1] / nums[nums.length - 2] : null
  const isGeometric =
    ratio !== null &&
    Number.isFinite(ratio) &&
    nums.every((n, i) => i === 0 || nums[i - 1] !== 0 && n / nums[i - 1] === ratio)
  if (!isGeometric) return null
  return {
    index: 1,
    raw: ctx,
    type: 'number_sequence',
    operator: null,
    operands: nums,
    sequenceSlots: [...nums, null, null, null],
    missingPositions: [nums.length, nums.length + 1, nums.length + 2],
    missingPosition: nums.length,
    knownResult: null,
    answer: [1, 2, 3].map((i) => nums[nums.length - 1] * ratio ** i),
    sequenceRatio: ratio,
    answerCount: 3,
    promptMn: `${nums.join(', ')} дарааллын дараагийн 3 тоог олоорой.`,
  }
}

function fallbackProblem(ctx) {
  const neighbor = parseNeighbor(ctx)
  if (neighbor) return neighbor
  const seq = parseSequence(ctx)
  if (seq) return seq
  const m = parseMath(ctx)
  if (!m) return null
  const type = m.op === '+' ? 'addition' : 'subtraction'
  return {
    index: 1, raw: ctx, type, operator: m.op, operands: [m.a, m.b],
    missingPosition: null, knownResult: null,
    answer: m.op === '+' ? m.a + m.b : m.a - m.b, promptMn: '',
  }
}

/* structured problem → RobotInteractive/VisualMath-д хэрэгтэй { a, b, op } */
function inferOperator(p) {
  if (p?.operator) return p.operator
  if (p?.type === 'addition') return '+'
  if (p?.type === 'subtraction') return '-'
  if (p?.type === 'multiplication') return '*'
  if (p?.type === 'division') return '/'
  return '+'
}

function toAB(p) {
  const [a, b] = (p.operands ?? []).map(Number)
  return { a: a ?? 0, b: b ?? 0, op: inferOperator(p) }
}

function problemKey(p) {
  if (!p) return ''
  return `${p.type}|${p.raw ?? ''}|${p.answer}|${(p.operands ?? []).join(',')}|${p.missingPosition}`
}

function problemToContext(p) {
  if (!p) return ''
  const raw = p.raw ?? ''
  return p.promptMn ? `${raw}\n${p.promptMn}` : raw
}

/* ── Visual Math: domino tiles + 3-choice click (нэмэх/хасах) ── */
function VisualMath({ problem, choices, onCorrect, onWrong }) {
  const { a, b, op } = problem
  const answer = op === '+' ? a + b : a - b
  const [selected, setSelected] = useState(null)
  const [phase, setPhase] = useState('choosing')

  const handleChoice = (n) => {
    if (phase !== 'choosing') return
    setSelected(n)
    if (n === answer) {
      setPhase('correct')
      onCorrect?.()
    } else {
      setPhase('wrong')
      setTimeout(() => setPhase('choosing'), 900)
      onWrong?.()
    }
  }

  const choiceState = (n) => {
    if (phase === 'choosing') return 'idle'
    if (n === answer)         return 'correct'
    if (n === selected)       return 'wrong'
    return 'idle'
  }

  return (
    <div className="vm-root">
      <div className="vm-equation">
        <div className="vm-durs-wrap">
          <NumberVisual value={a} row />
        </div>
        <span className="vm-op">{op}</span>
        <div className="vm-durs-wrap">
          <NumberVisual value={b} row />
        </div>
        <span className="vm-op">=</span>

        <div className={`vm-ans-slot${phase === 'correct' ? ' vm-ans-correct' : ''}`}>
          {phase === 'correct' ? (
            <>
              <div className="vm-durs-wrap vm-ans-durs">
                <NumberVisual value={answer} row />
              </div>
              <CelebrationBurst />
            </>
          ) : (
            <span className="adz-q">?</span>
          )}
        </div>
      </div>

      {phase !== 'correct' && (
        <div className="vm-choice-grid">
          {choices.map(n => (
            <button
              key={n}
              className={`vm-choice-btn vm-choice-${choiceState(n)}`}
              style={{ '--card-c': numColor(n) }}
              onClick={() => handleChoice(n)}
              disabled={phase !== 'choosing'}
            >
              <div className="vm-durs-wrap">
                <NumberVisual value={n} row />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* Нэмэх/хасахын choices-ийг идэвхтэй бодлогод нэг л удаа тооцно */
function VisualMathAuto({ problem, onCorrect, onWrong }) {
  const ab = useMemo(() => toAB(problem), [problem])
  const answer = ab.op === '+' ? ab.a + ab.b : ab.a - ab.b
  const choices = useMemo(() => makeChoices(answer), [answer])
  return <VisualMath problem={ab} choices={choices} onCorrect={onCorrect} onWrong={onWrong} />
}

/* Үгэн бодлого (тодорхой үйлдэлгүй): зөвхөн хариуг сонгуулна */
function AnswerChoice({ problem, onCorrect, onWrong }) {
  const answer = Number(problem.answer) || 0
  const choices = useMemo(() => makeChoices(answer), [answer])
  const [selected, setSelected] = useState(null)
  const [phase, setPhase] = useState('choosing')

  const handle = (n) => {
    if (phase !== 'choosing') return
    setSelected(n)
    if (n === answer) { setPhase('correct'); onCorrect?.() }
    else { setPhase('wrong'); setTimeout(() => setPhase('choosing'), 900); onWrong?.() }
  }
  const state = (n) =>
    phase === 'choosing' ? 'idle' : n === answer ? 'correct' : n === selected ? 'wrong' : 'idle'

  return (
    <div className="vm-root">
      <div className="vm-word-prompt">{problem.promptMn || problem.raw}</div>
      {phase === 'correct' ? (
        <div className="vm-ans-slot vm-ans-correct">
          <div className="vm-durs-wrap vm-ans-durs"><NumberVisual value={answer} row /></div>
          <CelebrationBurst />
        </div>
      ) : (
        <div className="vm-choice-grid">
          {choices.map(n => (
            <button
              key={n}
              className={`vm-choice-btn vm-choice-${state(n)}`}
              style={{ '--card-c': numColor(n) }}
              onClick={() => handle(n)}
              disabled={phase !== 'choosing'}
            >
              <div className="vm-durs-wrap"><NumberVisual value={n} row /></div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Төрлөөр нь тохирох интерактивийг сонгоно ── */
// Тухайн бодлого яг "40 − 5 × 7" мөн эсэх (× / x / х / * ямар ч хэлбэрээр)
function isFortyMinusFiveTimesSeven(raw) {
  const norm = String(raw ?? '').replace(/[xхX]/g, '×') // латин/кирилл x → ×
  const t = tokenizeExpression(norm) // × ба ÷ -г * / болгон нормчилно
  return t.length === 5 && t[0] === '40' && t[1] === '-' && t[2] === '5' && t[3] === '*' && t[4] === '7'
}

function ProblemInteractive({ problem, onCorrect, onWrong }) {
  if (!problem) return null
  // 40 − 5 × 7 → тусгай Minecraft интерактив (сагс, баганан бичлэг, зээлэх, алга таших)
  if (problem.type === 'long_expression' && isFortyMinusFiveTimesSeven(problem.raw))
    return <MinecraftFirstProblem onDone={onCorrect} onWrong={onWrong} />

  if (problem.type === 'comparison') {
    // Хоёр тал 0..99 бол аравт/нэгж Minecraft шоогоор (илэрхийлэлтэй талыг өөрөө бодуулна)
    const [ca, cb] = (problem.operands ?? []).map(Number)
    const fits = [ca, cb].every((n) => Number.isInteger(n) && n >= 0 && n <= 99)
    return fits
      ? <MinecraftCompare problem={problem} onCorrect={onCorrect} onWrong={onWrong} />
      : <ComparisonInteractive problem={problem} onCorrect={onCorrect} onWrong={onWrong} />
  }
  if (problem.type === 'missing_addend')
    return <MissingAddendInteractive problem={problem} onCorrect={onCorrect} onWrong={onWrong} />
  if (problem.type === 'number_sequence')
    return <NumberSequenceInteractive problem={problem} onCorrect={onCorrect} onWrong={onWrong} />
  if (problem.type === 'number_neighbor')
    return <NeighborNumberInteractive problem={problem} onCorrect={onCorrect} onWrong={onWrong} />
  if (problem.type === 'word') {
    // 2 тоотой энгийн нэмэх/хасах үгэн бодлого бол Minecraft номын түүхээр
    return extractStory(problem)
      ? <MinecraftWordOne problem={problem} onCorrect={onCorrect} onWrong={onWrong} />
      : <WordProblemInteractive problem={problem} onCorrect={onCorrect} onWrong={onWrong} />
  }
  if (problem.type === 'tens_ones')
    return <TensOnesInteractive problem={problem} onCorrect={onCorrect} onWrong={onWrong} />
  if (problem.type === 'equation_balance')
    return <EquationBalanceInteractive problem={problem} onCorrect={onCorrect} onWrong={onWrong} />
  if (problem.type === 'long_expression')
    return <LongExpressionInteractive problem={problem} onCorrect={onCorrect} onWrong={onWrong} />
  if (problem.type === 'length_unit')
    return <MinecraftLengthOne problem={problem} onCorrect={onCorrect} onWrong={onWrong} />

  const op = inferOperator(problem)
  if (op === '*' || op === '/')
    return <MulDivInteractive problem={problem} op={op} onCorrect={onCorrect} onWrong={onWrong} />
  if (op === '+' || op === '-') {
    const [a, b] = (problem.operands ?? []).map(Number)
    const answer = op === '+' ? a + b : a - b
    // 2 оронтой тоо орсон эсвэл хариу нь ≥10 бол өнгөт аравт/нэгж баганаар;
    // жижиг дан оронтойг блок домино хэлбэрээр.
    const useColumn = a >= 10 || b >= 10 || answer >= 10
    return useColumn
      ? <ColumnMathInteractive problem={problem} onCorrect={onCorrect} onWrong={onWrong} />
      : <VisualMathAuto problem={problem} onCorrect={onCorrect} onWrong={onWrong} />
  }

  return <AnswerChoice problem={problem} onCorrect={onCorrect} onWrong={onWrong} />
}

/* ── Speech bubble ── */
function trimBubble(text) {
  if (!text) return ''
  const first = text.split(/[.!?]/)[0] ?? text
  return first.length > 60 ? first.slice(0, 57) + '…' : first
}

// Typewriter эффектийг тусад нь салгав: shortText солигдоход key-ээр дахин mount
// хийгдэж, дотоод state автоматаар reset болно (effect дотор синхрон setState хэрэггүй).
function Typewriter({ text }) {
  const [displayed, setDisplayed] = useState('')
  const idxRef = useRef(0)

  useEffect(() => {
    if (!text) return
    idxRef.current = 0
    const timer = setInterval(() => {
      idxRef.current++
      setDisplayed(text.slice(0, idxRef.current))
      if (idxRef.current >= text.length) clearInterval(timer)
    }, 25)
    return () => clearInterval(timer)
  }, [text])

  return <p className="sb-text">{displayed}</p>
}

function SpeechBubble({ text, isThinking }) {
  const shortText = trimBubble(text)

  if (!text && !isThinking) return null

  return (
    <div className="sb-wrap">
      <div className="sb-box">
        {isThinking && !shortText ? (
          <span className="sb-dots"><span /><span /><span /></span>
        ) : (
          <Typewriter key={shortText} text={shortText} />
        )}
      </div>
    </div>
  )
}

/* ── Chat log ── */
function ChatLog({ messages }) {
  const bottomRef = useRef(null)
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  if (!messages.length) return null
  return (
    <div className="ta-chat-log">
      {messages.map((msg, i) => (
        <div key={i} className={`ta-chat-msg ta-chat-msg--${msg.role}`}>
          <span className="ta-chat-text">{msg.text}</span>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}

/* ── Main TutorAvatar ── */
export function TutorAvatar({ nickname, homeworkContext, problems = [], analyzing = false, avatar = 'robot' }) {
  // interpretCommand-ийг тогтвортой реф-ээр useTutor руу дамжуулна (доор шинэчилнэ).
  const cmdRef = useRef(() => false)
  const interpretCommand = useCallback((text) => cmdRef.current(text), [])

  const {
    isSpeaking, isListening, isThinking, error,
    lastText, chatMessages, greet, chat, explainProblem, speak,
    startAlwaysListen, stopAlwaysListen, stopCurrentAudio,
  } = useTutor({ nickname, homeworkContext, interpretCommand })

  const isJoy  = avatar === 'robot'
  const isMc   = avatar === 'minecraft'
  const isMcq  = avatar === 'mcqueen'
  const isAstro = avatar === 'astronaut'

  const [inputText, setInputText] = useState('')

  const handleSendText = useCallback(() => {
    const text = inputText.trim()
    if (!text || isThinking) return
    setInputText('')
    chat(text)
  }, [inputText, isThinking, chat])

  const greetedRef = useRef(false)
  const askedRef = useRef(false)
  const analyzingSaidRef = useRef(false)
  const lastExplainedRef = useRef('')
  // Олон бодлого орж ирэхэд ЭХНИЙ бодлогоос эхэлнэ (жагсаалтаас сонгуулж асуухгүй)
  const [selectedIndex, setSelectedIndex] = useState(0)
  // Хүүхэд "← Бодлогууд" дарж бүх бодлогын жагсаалтыг үзэхийг хүсвэл л жагсаалт нээгдэнэ
  const [showListView, setShowListView] = useState(false)
  // Зөв хариулсан үед background-ийг богино хугацаанд баяр хөөртэй болгоно
  const [celebrating, setCelebrating] = useState(false)

  // structured problems, эс бол хуучин нэг текстээс fallback
  const structuredProblems = useMemo(() => {
    if (problems?.length) return normalizeHomeworkProblems(problems)
    const fb = fallbackProblem(homeworkContext)
    return fb ? normalizeHomeworkProblems([fb]) : []
  }, [problems, homeworkContext])

  // Шинэ даалгавар орж ирэхэд эхний бодлогоос эхэлнэ.
  // State-ийг render үед өмнөх утгатай харьцуулж reset хийнэ (effect дотор setState хийхээс зайлсхийв).
  const [prevProblems, setPrevProblems] = useState(structuredProblems)
  if (prevProblems !== structuredProblems) {
    setPrevProblems(structuredProblems)
    setSelectedIndex(0)
    setShowListView(false)
  }
  // Ref-үүдийг зөвхөн effect дотор reset хийнэ (render үед ref өөрчилж болохгүй).
  useEffect(() => {
    askedRef.current = false
    lastExplainedRef.current = ''
  }, [structuredProblems])

  const effectiveIndex = structuredProblems.length
    ? Math.min(selectedIndex ?? 0, structuredProblems.length - 1)
    : null

  const showList = structuredProblems.length > 1 && showListView
  // Зөвхөн зураг дээрх бодлогыг ашиглана (AI шинэ бодлого зохиохгүй)
  const activeProblem = !showList && effectiveIndex != null
    ? structuredProblems[effectiveIndex]
    : null

  const selectProblem = useCallback((i) => {
    setSelectedIndex(i)
    setShowListView(false)
  }, [])

  // interpretCommand логикийг рендер бүрийн дараа шинэчилнэ (сүүлийн state-ийг барина)
  useEffect(() => {
    cmdRef.current = (text) => {
      if (!structuredProblems.length) return false
      // Тусламж/асуулт бол сонголт БИШ — chat руу дамжуулж AI дахин тайлбарлана.
      if (HELP_RE.test(text.toLowerCase())) return false
      const selecting = showListView && structuredProblems.length > 1
      const idx = extractProblemNumber(text, { requireKeyword: !selecting })
      if (idx == null || idx < 1 || idx > structuredProblems.length) return false
      // Одоогийн бодлогоо дахин нэрлэвэл шилжихгүй — chat-аар дахин тайлбарлуулна.
      const current = (effectiveIndex ?? -1) + 1
      if (idx === current) return false
      selectProblem(idx - 1)
      return true
    }
  })

  // greet (mount)
  useEffect(() => {
    if (greetedRef.current || !nickname) return
    greetedRef.current = true
    greet().then(() => startAlwaysListen())
    return () => { stopAlwaysListen(); stopCurrentAudio() }
  }, [nickname]) // eslint-disable-line react-hooks/exhaustive-deps

  // Хүүхэд бүх бодлогын жагсаалтыг нээвэл "аль вэ?" гэж асууна
  useEffect(() => {
    if (structuredProblems.length > 1 && showListView && !askedRef.current && greetedRef.current) {
      askedRef.current = true
      speak(`${nickname}, аль бодлогыг хамт бодох вэ? Дугаарыг нь хэлээрэй.`)
    }
    if (!showListView) askedRef.current = false
  }, [structuredProblems.length, showListView, nickname, speak])

  // Зураг шинжиж байх үед зааварчилгааны оронд "түр хүлээ" гэж хэлнэ
  useEffect(() => {
    if (analyzing && !analyzingSaidRef.current && greetedRef.current) {
      analyzingSaidRef.current = true
      speak('Зургийг чинь шинжилж байна, түр хүлээгээрэй.')
    }
    if (!analyzing) analyzingSaidRef.current = false
  }, [analyzing, speak])

  // Идэвхтэй бодлого солигдох бүрт тухайн бодлогыг тайлбарлуулна
  useEffect(() => {
    if (!activeProblem) return
    const key = problemKey(activeProblem)
    if (lastExplainedRef.current === key) return
    lastExplainedRef.current = key
    explainProblem(problemToContext(activeProblem))
  }, [activeProblem, explainProblem])

  const handleCorrect = useCallback(() => {
    chat('зөв хариулт')
    // Зөв хариулсан тул background-ийг богино хугацаанд баяр хөөртэй болгоно
    setCelebrating(true)
    setTimeout(() => setCelebrating(false), 1800)
    // Магтаалыг тоглуулах зуур түр зогсоод ЗУРАГ ДЭЭРХ дараагийн бодлого руу шилжинэ.
    // AI шинэ бодлого зохиохгүй — зөвхөн оруулсан зураг дээрх бодлогуудыг дараалуулна.
    const total = structuredProblems.length
    const cur = effectiveIndex ?? 0
    const next = cur + 1
    setTimeout(() => {
      if (next < total) {
        setSelectedIndex(next)
      } else if (total > 1) {
        // Бүх бодлого дууслаа — жагсаалт руу БУЦААХГҮЙ (дахин "аль вэ?" гэж асуухгүй).
        // Сүүлийн бодлого баяр хүргэсэн хэвээрээ үлдэнэ.
        speak(`Сайн байна ${nickname}! Бүх бодлогоо дууслаа. Гоё ажиллалаа!`)
      } else {
        speak(`Гайхалтай ${nickname}! Бодлогоо зөв бодлоо.`)
      }
    }, 2500)
  }, [chat, effectiveIndex, structuredProblems.length, nickname, speak])

  const handleWrong = useCallback(() => {
    chat('буруу хариулт өглөө')
  }, [chat])

  function statusLabel() {
    if (isSpeaking)  return { text: 'ЯРЬЖ БАЙНА…',  cls: 'status-speaking' }
    if (isListening) return { text: 'СОНСОЖ БАЙНА…', cls: 'status-listening' }
    if (isThinking)  return { text: 'БОДОЖ БАЙНА…',  cls: 'status-thinking' }
    return { text: 'БЭЛЭН', cls: '' }
  }
  const { text: statusText, cls: statusCls } = statusLabel()
  const mascotMood = isSpeaking ? 'speaking' : isListening ? 'listening' : isThinking ? 'thinking' : 'ready'

  const showInteractive = !showList && activeProblem
  const showProblemPane = showList || showInteractive

  // Бодлого бүрд background-ийн өнгө аяс өөр болгоно (5 палитр эргэлдэнэ)
  const themeIndex = ((effectiveIndex ?? 0) % 5 + 5) % 5

  return (
    <div
      className={`ta-root${showProblemPane ? ' ta-root-split' : ' ta-root-center'}${celebrating ? ' ta-celebrate' : ''}${isJoy ? ' ta-joy' : ''}${isMc ? ' ta-mc' : ''}${isMcq ? ' ta-mcq' : ''}${isAstro ? ' ta-astro' : ''}`}
      data-theme={themeIndex}
    >
      {isJoy && <JoyBackground />}
      {isMc && <MinecraftBackground />}
      {isMcq && <McQueenBackground />}
      <div className="ta-blob ta-blob-1" />
      <div className="ta-blob ta-blob-2" />
      <div className="ta-blob ta-blob-3" />
      {celebrating && <CelebrationBurst />}

      {/* LEFT — interactive board / problem list (only when a problem is active) */}
      {showProblemPane && (
        <div className="ta-problem-pane">
          {showList ? (
            <ProblemList
              problems={structuredProblems}
              selectedIndex={selectedIndex}
              onSelect={selectProblem}
            />
          ) : activeProblem ? (
            <>
              {structuredProblems.length > 1 && (
                <div className="ta-problem-nav">
                  <button className="ta-back-btn" onClick={() => setShowListView(true)}>
                    ← Бодлогууд
                  </button>
                  <span className="ta-problem-progress">
                    Бодлого {(effectiveIndex ?? 0) + 1} / {structuredProblems.length}
                  </span>
                </div>
              )}
              <ProblemInteractive
                key={problemKey(activeProblem)}
                problem={activeProblem}
                onCorrect={handleCorrect}
                onWrong={handleWrong}
              />
            </>
          ) : null}
        </div>
      )}

      {/* RIGHT (or centered) — robot + speech bubble + status */}
      <div className="ta-robot-col">
        {isJoy ? (
          <div className="joy-stage">
            <JoyRobot mood={mascotMood} />
          </div>
        ) : isMc ? (
          <div className="mc-stage mc-stage--3d">
            <MinecraftSteveScene
              variant="compact"
              mood={celebrating ? 'celebrate' : mascotMood}
            />
          </div>
        ) : isMcq ? (
          <div className="mcq-stage">
            <img src="/McQueen.png" alt="Маккуин найз" draggable="false" />
          </div>
        ) : isAstro ? (
          <div className="astro-stage">
            <AstronautLoader />
          </div>
        ) : (
          <div className={`tutor-spline-wrap tutor-spline-big${showProblemPane ? ' tutor-spline-side' : ''}`}>
            <MascotScene avatar={avatar} className="tutor-mascot" mood={mascotMood} />
          </div>
        )}
        <SpeechBubble text={lastText} isThinking={isThinking} />
        <div className="ta-status-row">
          {isListening && <span className="tutor-listen-dot" />}
          <span className={`tutor-status${statusCls ? ` ${statusCls}` : ''}`}>{statusText}</span>
        </div>
        <ChatLog messages={chatMessages} />
        <div className="ta-text-input-row">
          <input
            className="ta-text-input"
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSendText()}
            placeholder="Бич эсвэл яриарай..."
            disabled={isThinking}
          />
          <button
            className="ta-text-send-btn"
            onClick={handleSendText}
            disabled={!inputText.trim() || isThinking}
          >
            ➤
          </button>
        </div>
        {error && <p className="tutor-error">{error}</p>}
      </div>
    </div>
  )
}
