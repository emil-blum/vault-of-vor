const FUTHARK_ALL = 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ'

const LATIN_TO_FUTHARK = {
  a: 'ᚨ', b: 'ᛒ', c: 'ᚲ', d: 'ᛞ', e: 'ᛖ',
  f: 'ᚠ', g: 'ᚷ', h: 'ᚺ', i: 'ᛁ', j: 'ᛃ',
  k: 'ᚲ', l: 'ᛚ', m: 'ᛗ', n: 'ᚾ', o: 'ᛟ',
  p: 'ᛈ', q: 'ᚲ', r: 'ᚱ', s: 'ᛊ', t: 'ᛏ',
  u: 'ᚢ', v: 'ᚢ', w: 'ᚹ', x: 'ᛉ', y: 'ᛃ',
  z: 'ᛉ',
  ö: 'ᛟ', ü: 'ᚢ', ā: 'ᚨ', ū: 'ᚢ', ē: 'ᛖ',
}

function randomRune() {
  return FUTHARK_ALL[Math.floor(Math.random() * FUTHARK_ALL.length)]
}

export function toRune(char) {
  return LATIN_TO_FUTHARK[char.toLowerCase()] || char
}

function isLetter(char) {
  return /[a-zA-ZöüāūēÖÜĀŪĒ]/.test(char)
}

const MAX_STAGGER = 80  // ms — random spread keeps chars feeling near-simultaneous
const CYCLE_MS   = 50  // ms per flicker frame

// Scatter-animation controller: interruptible, random char order
function createController(el, originalText) {
  const originalChars = originalText.split('')
  const letterIdxs = originalChars
    .map((c, i) => (isLetter(c) ? i : null))
    .filter(i => i !== null)

  let display = [...originalChars]
  let tids = []
  let iids = []
  let gen  = 0  // generation counter guards against stale timer callbacks

  function cancelAll() {
    tids.forEach(id => clearTimeout(id))
    iids.forEach(id => clearInterval(id))
    tids = []
    iids = []
    gen++
  }

  function run(targets, onDone) {
    cancelAll()
    if (targets.length === 0) { onDone?.(); return }

    const myGen = gen
    let remaining = targets.length

    targets.forEach(([idx, targetChar]) => {
      const delay  = Math.floor(Math.random() * MAX_STAGGER)
      const cycles = 2 + Math.floor(Math.random() * 3)  // 2-4 flickers per char
      let   cycle  = 0

      const tid = setTimeout(() => {
        if (gen !== myGen) return

        const iid = setInterval(() => {
          if (gen !== myGen) { clearInterval(iid); return }

          cycle++
          if (cycle <= cycles) {
            display[idx] = randomRune()
          } else {
            clearInterval(iid)
            display[idx] = targetChar
            remaining--
            if (remaining === 0) onDone?.()
          }
          el.textContent = display.join('')
        }, CYCLE_MS)

        iids.push(iid)
      }, delay)

      tids.push(tid)
    })
  }

  function forward(onDone) {
    const targets = letterIdxs.map(i => [i, toRune(originalChars[i])])
    run(targets, onDone)
  }

  function reverse(onDone) {
    // Only chars that actually changed need to animate back
    const targets = letterIdxs
      .filter(i => display[i] !== originalChars[i])
      .map(i => [i, originalChars[i]])

    run(targets, () => {
      display = [...originalChars]
      el.textContent = originalText
      onDone?.()
    })
  }

  return { forward, reverse }
}

// ─── Title elements (.rune-target) ───────────────────────────────────────────

export function initRuneTargets() {
  document.querySelectorAll('.rune-target').forEach(el => {
    const original = el.textContent
    const ctrl = createController(el, original)
    let state = 'latin'

    el.addEventListener('mouseenter', () => {
      if (state === 'rune') return
      state = 'fwd'
      ctrl.forward(() => { state = 'rune' })
    })

    el.addEventListener('mouseleave', () => {
      if (state === 'latin') return
      state = 'rev'
      ctrl.reverse(() => { state = 'latin' })
    })
  })
}

// ─── Buttons (.rune-btn) ─────────────────────────────────────────────────────

export function initRuneButtons() {
  document.querySelectorAll('.rune-btn').forEach(btn => attachRuneBtn(btn))
}

export function attachRuneBtn(btn) {
  const originalText = Array.from(btn.childNodes)
    .filter(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim())
    .map(n => n.textContent)
    .join('')
    .trim()

  if (!originalText) return

  const span = document.createElement('span')
  span.className = 'btn-rune-text'
  span.textContent = originalText

  const nodesToRemove = []
  for (const node of btn.childNodes) {
    if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
      nodesToRemove.push(node)
    }
  }
  if (nodesToRemove.length === 0) return
  nodesToRemove[0].replaceWith(span)
  nodesToRemove.slice(1).forEach(n => n.remove())

  // Lock the span at the wider of latin/rune so layout never shifts.
  // Buttons inside inactive tabs have display:none, so we force visibility
  // temporarily (invisible to the user) to get accurate measurements.
  const view = btn.closest('.view')
  if (view && getComputedStyle(view).display === 'none') {
    view.style.display     = 'flex'
    view.style.visibility  = 'hidden'
    view.style.pointerEvents = 'none'
  }

  const latinSpanW = span.getBoundingClientRect().width
  const runeEquiv  = originalText.split('').map(c => LATIN_TO_FUTHARK[c.toLowerCase()] || c).join('')
  span.textContent = runeEquiv
  const runeSpanW  = span.getBoundingClientRect().width
  span.textContent = originalText

  if (view && view.style.visibility === 'hidden') {
    view.style.display      = ''
    view.style.visibility   = ''
    view.style.pointerEvents = ''
  }

  if (latinSpanW > 0) {
    span.style.display   = 'inline-block'
    span.style.width     = Math.max(latinSpanW, runeSpanW) + 'px'
    span.style.textAlign = 'center'
    span.style.lineHeight = '1'
  }

  const ctrl = createController(span, originalText)
  let state = 'latin'

  btn.addEventListener('mouseenter', () => {
    if (state === 'rune') return
    state = 'fwd'
    ctrl.forward(() => { state = 'rune' })
  })

  btn.addEventListener('mouseleave', () => {
    if (state === 'latin') return
    state = 'rev'
    ctrl.reverse(() => { state = 'latin' })
  })
}
