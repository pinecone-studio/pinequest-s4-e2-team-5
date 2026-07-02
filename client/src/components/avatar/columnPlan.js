// Баганан нэмэх/хасахын алхмуудыг (нэгж → аравт, зөөх/зээлэх) урьдчилан бэлдэнэ.
export function planColumns(a, b, op) {
  const answer = op === '+' ? a + b : a - b
  const oa = a % 10
  const ob = b % 10
  const ta = Math.floor(a / 10)
  const tb = Math.floor(b / 10)
  const hasTens = ta > 0 || tb > 0
  const steps = []

  if (op === '+') {
    const onesSum = oa + ob
    steps.push({ col: 'ones', a: oa, b: ob, op: '+', ask: onesSum })
    const carry = Math.floor(onesSum / 10)
    if (hasTens) {
      steps.push({ col: 'tens', a: ta, b: tb, op: '+', carryIn: carry, ask: ta + tb + carry })
    }
  } else {
    let borrow = 0
    let oaEff = oa
    if (oa < ob) { oaEff = oa + 10; borrow = 1 }
    steps.push({ col: 'ones', a: oaEff, b: ob, op: '-', borrow, ask: oaEff - ob })
    if (hasTens) {
      steps.push({ col: 'tens', a: ta - borrow, b: tb, op: '-', borrowIn: borrow, ask: ta - borrow - tb })
    }
  }
  return { answer, oa, ob, ta, tb, hasTens, op, a, b, steps }
}
