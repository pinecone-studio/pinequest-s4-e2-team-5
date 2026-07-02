// 2-р бодлого (worksheet): 77 ? 57  ба  9 + 5 ? 15 — дараалан хоёр жишилт.
// Бодит логик нь MinecraftCompare (нэг бодлого) дотор; энд зөвхөн 2 удаа дуудна.
import { useState } from 'react'
import { MinecraftCompare } from './MinecraftCompare.jsx'

const ROUNDS = [
  { operands: [77, 57], answer: 1, raw: '77 ? 57' },
  { operands: [14, 15], answer: -1, raw: '9 + 5 ? 15' },
]

export function MinecraftComparison({ onDone }) {
  const [round, setRound] = useState(0)

  const handleCorrect = () => {
    setTimeout(() => {
      if (round + 1 < ROUNDS.length) setRound(round + 1)
      else onDone?.()
    }, 1600)
  }

  return (
    <MinecraftCompare
      key={round}
      problem={ROUNDS[round]}
      onCorrect={handleCorrect}
      onWrong={() => {}}
    />
  )
}

export default MinecraftComparison
