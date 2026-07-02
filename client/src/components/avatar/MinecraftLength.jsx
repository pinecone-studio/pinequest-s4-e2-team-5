// 3-р бодлого (worksheet): 5 дм = ? см  ба  35 см = ? дм ? см — дараалан хоёр даалгавар.
// Бодит логик нь MinecraftLengthOne дотор.
import { useState } from 'react'
import { MinecraftLengthOne } from './MinecraftLengthOne.jsx'

const TASKS = [
  { raw: '5 дм = ? см' },
  { raw: '35 см = ? дм ? см' },
]

export function MinecraftLength({ onDone }) {
  const [i, setI] = useState(0)
  const handleCorrect = () => {
    setTimeout(() => {
      if (i + 1 < TASKS.length) setI(i + 1)
      else onDone?.()
    }, 1600)
  }
  return (
    <MinecraftLengthOne key={i} problem={TASKS[i]} onCorrect={handleCorrect} onWrong={() => {}} />
  )
}

export default MinecraftLength
