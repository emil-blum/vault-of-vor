let mediaRecorder    = null
let audioChunks      = []
let recordedBlob     = null
let recTimerInterval = null
let recSeconds       = 0
let previewPlaying   = false

let audioCtx      = null
let analyser      = null
let waveAnimFrame = null

export function getRecordedBlob() {
  return recordedBlob
}

export function formatTime(secs) {
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return m + ':' + String(s).padStart(2, '0')
}

export function initAudio() {
  document.getElementById('btn-rec-start').addEventListener('click', startRecording)
  document.getElementById('btn-rec-stop').addEventListener('click', stopRecording)
  document.getElementById('btn-rec-reset').addEventListener('click', resetAudio)
  document.getElementById('btn-play-preview').addEventListener('click', togglePreviewPlay)
  document.getElementById('seek-pre').addEventListener('input', e => seekPreview(e.target.value))

  const audio = document.getElementById('audioPreview')
  audio.addEventListener('timeupdate', () => {
    const pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0
    document.getElementById('seek-pre').value = pct
    document.getElementById('time-pre').textContent = formatTime(audio.currentTime)
  })
  audio.addEventListener('ended', () => {
    previewPlaying = false
    syncPreviewIcons()
  })
}

export async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaRecorder = new MediaRecorder(stream)
    audioChunks   = []
    recSeconds    = 0

    // Waveform analyser
    audioCtx = new AudioContext()
    const source = audioCtx.createMediaStreamSource(stream)
    analyser = audioCtx.createAnalyser()
    analyser.fftSize = 128
    analyser.smoothingTimeConstant = 0.75
    source.connect(analyser)

    mediaRecorder.ondataavailable = e => audioChunks.push(e.data)
    mediaRecorder.onstop = () => {
      recordedBlob = new Blob(audioChunks, { type: 'audio/webm' })
      const url    = URL.createObjectURL(recordedBlob)
      document.getElementById('audioPreview').src = url
      showRecState('done')
      stopWaveform()
    }

    mediaRecorder.start()
    showRecState('recording')

    recTimerInterval = setInterval(() => {
      recSeconds++
      document.getElementById('rec-timer').textContent = formatTime(recSeconds)
    }, 1000)

    requestAnimationFrame(initWaveformDraw)
  } catch (_) {
    alert('Microphone access denied.\nOn mobile the app must be served over HTTPS.')
  }
}

export function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop()
  clearInterval(recTimerInterval)
}

export function resetAudio() {
  recordedBlob = null
  document.getElementById('audioPreview').src = ''
  showRecState('idle')
}

export function togglePreviewPlay() {
  const audio = document.getElementById('audioPreview')
  if (audio.paused) { audio.play(); previewPlaying = true }
  else              { audio.pause(); previewPlaying = false }
  syncPreviewIcons()
}

function seekPreview(val) {
  const audio = document.getElementById('audioPreview')
  if (audio.duration) audio.currentTime = audio.duration * (val / 100)
}

function showRecState(state) {
  ;['idle', 'recording', 'done'].forEach(s =>
    document.getElementById('rec-' + s).classList.toggle('hidden', s !== state)
  )
}

function syncPreviewIcons() {
  document.getElementById('icon-play-pre').classList.toggle('hidden', previewPlaying)
  document.getElementById('icon-pause-pre').classList.toggle('hidden', !previewPlaying)
}

// ─── Waveform ────────────────────────────────────────────────────────────────

function initWaveformDraw() {
  const canvas = document.getElementById('rec-waveform')
  if (!canvas || !analyser) return
  // Size the canvas to its rendered pixel dimensions
  const parent = canvas.parentElement
  canvas.width  = parent.clientWidth  || 280
  canvas.height = 48
  drawWaveform()
}

function drawWaveform() {
  if (!analyser) return
  waveAnimFrame = requestAnimationFrame(drawWaveform)

  const canvas = document.getElementById('rec-waveform')
  if (!canvas) return
  const ctx    = canvas.getContext('2d')
  const w      = canvas.width
  const h      = canvas.height
  const bins   = analyser.frequencyBinCount  // 64
  const data   = new Uint8Array(bins)
  analyser.getByteFrequencyData(data)

  ctx.clearRect(0, 0, w, h)

  // Use lower 32 bins (voice frequency range looks best)
  const numBars = 32
  const gap     = 2
  const barW    = (w - gap * (numBars - 1)) / numBars

  for (let i = 0; i < numBars; i++) {
    const val  = data[i]
    const barH = Math.max(2, (val / 255) * h * 0.85)
    const x    = i * (barW + gap)
    const alpha = 0.25 + (val / 255) * 0.5
    ctx.fillStyle = `rgba(188,0,0,${alpha.toFixed(2)})`
    // Round the top of each bar
    const r = Math.min(barW / 2, barH / 2, 2)
    ctx.beginPath()
    ctx.moveTo(x + r, h - barH)
    ctx.lineTo(x + barW - r, h - barH)
    ctx.arcTo(x + barW, h - barH, x + barW, h - barH + r, r)
    ctx.lineTo(x + barW, h)
    ctx.lineTo(x, h)
    ctx.lineTo(x, h - barH + r)
    ctx.arcTo(x, h - barH, x + r, h - barH, r)
    ctx.closePath()
    ctx.fill()
  }
}

function stopWaveform() {
  if (waveAnimFrame) { cancelAnimationFrame(waveAnimFrame); waveAnimFrame = null }
  if (audioCtx)      { audioCtx.close(); audioCtx = null }
  analyser = null
  const canvas = document.getElementById('rec-waveform')
  if (canvas) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
}

// ─── Global pause ────────────────────────────────────────────────────────────

export function pauseAll() {
  ;['audioPreview', 'decodedAudio'].forEach(id => {
    const el = document.getElementById(id)
    if (el) el.pause()
  })
}

export function initMsgMode() {
  document.getElementById('msg-tab-text').addEventListener('click', () => setMsgMode('text'))
  document.getElementById('msg-tab-audio').addEventListener('click', () => setMsgMode('audio'))
  document.getElementById('secretText').addEventListener('input', function () {
    document.getElementById('charCount').textContent = this.value.length + ' characters'
  })
}

export let msgMode = 'text'

export function setMsgMode(m) {
  msgMode = m
  document.getElementById('msg-tab-text').classList.toggle('active', m === 'text')
  document.getElementById('msg-tab-audio').classList.toggle('active', m === 'audio')
  document.getElementById('msg-text-area').classList.toggle('hidden', m !== 'text')
  document.getElementById('msg-audio-area').classList.toggle('hidden', m !== 'audio')
}
