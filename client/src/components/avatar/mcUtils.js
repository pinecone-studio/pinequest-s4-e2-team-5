// Minecraft бодлогуудын цэвэр туслах функцүүд (JSX-гүй).
export function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Зөв хариунд ойрхон 3 сонголт (0-оос доошгүй)
export function makeChoices(answer, deltas = [1, -1, 2, -2, 3, -3, 5, -5, 10, -10]) {
  const set = new Set([answer])
  for (const d of deltas) {
    const v = answer + d
    if (v >= 0 && v !== answer) set.add(v)
    if (set.size >= 3) break
  }
  let g = 1
  while (set.size < 3) set.add(answer + g++)
  return shuffle([...set].slice(0, 3))
}
