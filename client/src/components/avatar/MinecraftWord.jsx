// 4-р бодлого (worksheet): Сумьяа/Амгалан үгэн бодлого — MinecraftWordOne-оор.
import { MinecraftWordOne } from './MinecraftWordOne.jsx'

const PROBLEM = {
  raw: 'Сумьяа 5 ном уншив. Амгалан Сумьяагаас 6-аар олон уншив. Амгалан хэдэн ном уншсан бэ?',
  promptMn: 'Сумьяа 5 ном уншив. Амгалан 6-аар олон уншив. Амгалан хэдэн ном уншсан бэ?',
  answer: 11,
}

export function MinecraftWord({ onDone }) {
  return <MinecraftWordOne problem={PROBLEM} onCorrect={onDone} onWrong={() => {}} />
}

export default MinecraftWord
