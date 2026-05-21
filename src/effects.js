// Pixel scatter effect — plays over an image during encode/decode.
// Blocks activate in independent regional clusters, not a diagonal wave.

const BLOCK_SIZE   = 8    // square pixel blocks
const NUM_REGIONS  = 12   // independent encoding "zones"
const SIGMA        = 0.08  // narrow bell = short flash per block

export function playScatter(wrapEl, durationMs = 750) {
  return new Promise(resolve => {
    const canvas  = document.createElement('canvas')
    canvas.className = 'scatter-canvas'

    const img     = wrapEl.querySelector('img')
    const imgRect = img ? img.getBoundingClientRect() : wrapEl.getBoundingClientRect()
    const wrapRect = wrapEl.getBoundingClientRect()

    const w = Math.round(wrapRect.width)
    const h = Math.round(imgRect.height || wrapRect.height)
    if (w === 0 || h === 0) { resolve(); return }

    canvas.width  = w
    canvas.height = h
    canvas.style.height = h + 'px'

    wrapEl.style.position = 'relative'
    wrapEl.appendChild(canvas)

    const ctx  = canvas.getContext('2d')
    const cols = Math.ceil(w / BLOCK_SIZE)
    const rows = Math.ceil(h / BLOCK_SIZE)

    // Regional start times — clusters of blocks activate together
    const regionStarts = Array.from({ length: NUM_REGIONS }, () => Math.random() * 0.70)

    const blocks = []
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const region = Math.floor(Math.random() * NUM_REGIONS)
        const jitter = (Math.random() - 0.5) * 0.12  // ±6% variation within region
        const phase  = Math.max(0, Math.min(0.88, regionStarts[region] + jitter))
        blocks.push({
          x: c * BLOCK_SIZE,
          y: r * BLOCK_SIZE,
          phase,
          white: Math.random() > 0.5,  // black or white block
        })
      }
    }

    let start = null

    function tick(ts) {
      if (!start) start = ts
      const progress = Math.min((ts - start) / durationMs, 1)

      ctx.clearRect(0, 0, w, h)

      for (const b of blocks) {
        const delta   = progress - b.phase
        const opacity = Math.max(0, Math.exp(-(delta * delta) / (2 * SIGMA * SIGMA)) * 0.92)
        if (opacity < 0.03) continue

        ctx.globalAlpha = opacity
        ctx.fillStyle   = b.white ? '#ffffff' : '#000000'
        ctx.fillRect(b.x, b.y, BLOCK_SIZE - 1, BLOCK_SIZE - 1)
      }

      ctx.globalAlpha = 1

      if (progress < 1) {
        requestAnimationFrame(tick)
      } else {
        ctx.clearRect(0, 0, w, h)
        canvas.remove()
        resolve()
      }
    }

    requestAnimationFrame(tick)
  })
}
