import { decryptData }   from './crypto.js'
import { extractData }   from './steganography.js'
import { escapeHtml }    from './ui.js'
import { formatTime }    from './audio.js'
import { playScatter }   from './effects.js'

let loadedEncryptedBuf = null
let decodedPlaying     = false

export function initDecode() {
  document.getElementById('decodeFile').addEventListener('change', e => {
    const file = e.target.files[0]
    if (file) processFile(file)
  })

  document.getElementById('btn-decrypt').addEventListener('click', triggerDecrypt)
  document.getElementById('btn-clear-decode').addEventListener('click', clearDecode)
  document.getElementById('decodePassword').addEventListener('keydown', e => {
    if (e.key === 'Enter') triggerDecrypt()
  })

  document.getElementById('btn-toggle-pw-decode').addEventListener('click', () => {
    const input  = document.getElementById('decodePassword')
    const isText = input.type === 'text'
    input.type   = isText ? 'password' : 'text'
    document.getElementById('pw-eye-decode').classList.toggle('hidden', !isText)
    document.getElementById('pw-eye-off-decode').classList.toggle('hidden', isText)
  })

  const dz = document.getElementById('dropZone')
  dz.addEventListener('dragover',  e => { e.preventDefault(); dz.classList.add('drag-over') })
  dz.addEventListener('dragleave', ()  => dz.classList.remove('drag-over'))
  dz.addEventListener('drop', e => {
    e.preventDefault()
    dz.classList.remove('drag-over')
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  })
}

function processFile(file) {
  resetDecodeUI()

  const reader = new FileReader()
  reader.onload = evt => {
    document.getElementById('decode-preview-img').src = evt.target.result
    document.getElementById('decode-file-name').textContent = file.name
    document.getElementById('dropZone').classList.add('hidden')
    document.getElementById('decode-preview-wrap').classList.remove('hidden')

    const img = new Image()
    img.onload = () => extractFromImage(img)
    img.src    = evt.target.result
  }
  reader.readAsDataURL(file)
}

function extractFromImage(img) {
  const cvs  = document.getElementById('decodeCanvas')
  const ctx  = cvs.getContext('2d')
  cvs.width  = img.width
  cvs.height = img.height
  ctx.drawImage(img, 0, 0)
  const pixels = ctx.getImageData(0, 0, img.width, img.height).data

  try {
    const header     = extractData(pixels, 4)
    const payloadLen = new DataView(header.buffer).getUint32(0)
    if (payloadLen <= 0 || payloadLen > 50_000_000) throw new Error()
    loadedEncryptedBuf = extractData(pixels, 4 + payloadLen).slice(4)
    document.getElementById('passwordSection').classList.remove('hidden')
    document.getElementById('decodePassword').focus()
  } catch (_) {
    showError('No hidden message found in this image.')
  }
}

async function triggerDecrypt() {
  if (!loadedEncryptedBuf) return
  const password = document.getElementById('decodePassword').value.trim()
  if (!password) {
    document.getElementById('decodePassword').focus()
    return
  }

  showLoading(true)
  hideError()

  const previewWrap = document.getElementById('decode-preview-wrap')

  try {
    // Scatter and decryption run in parallel
    const [, raw] = await Promise.all([
      playScatter(previewWrap, 800),
      decryptData(loadedEncryptedBuf, password),
    ])

    const type    = raw[0]
    const content = raw.slice(1)

    showLoading(false)

    if (type === 0x01) {
      renderTextResult(new TextDecoder().decode(content))
    } else if (type === 0x02) {
      renderAudioResult(content)
    } else {
      throw new Error('Unknown message type.')
    }
  } catch (e) {
    showLoading(false)
    const msg = e.message
    showError(
      msg && (msg.includes('decrypt') || msg.includes('Operation'))
        ? 'Wrong password — message could not be decrypted.'
        : (msg || 'Decryption failed.')
    )
  }
}

function renderTextResult(text) {
  const result = document.getElementById('decryptResult')
  result.innerHTML = `
    <div class="decode-result fade-in">
      <div class="result-label">Decoded Message</div>
      <div class="result-text" id="decoded-text-out">${escapeHtml(text)}</div>
      <button class="copy-btn" id="btn-copy-decoded">
        <i data-lucide="copy"></i> Copy
      </button>
    </div>`
  result.classList.remove('hidden')

  if (window.__lucideCreateIcons) window.__lucideCreateIcons()

  document.getElementById('btn-copy-decoded').addEventListener('click', () => {
    navigator.clipboard.writeText(text).then(() => {
      const btn = document.getElementById('btn-copy-decoded')
      if (btn) {
        btn.innerHTML = '<i data-lucide="check"></i> Copied!'
        if (window.__lucideCreateIcons) window.__lucideCreateIcons()
        setTimeout(() => {
          btn.innerHTML = '<i data-lucide="copy"></i> Copy'
          if (window.__lucideCreateIcons) window.__lucideCreateIcons()
        }, 2000)
      }
    })
  })
}

function renderAudioResult(content) {
  const blob = new Blob([content], { type: 'audio/webm' })
  const url  = URL.createObjectURL(blob)

  const result = document.getElementById('decryptResult')
  result.innerHTML = `
    <div class="decode-result fade-in">
      <div class="result-label">Voice Note</div>
      <div class="player-wrap">
        <button class="play-btn" id="btn-play-decoded">
          <i data-lucide="play"  id="icon-play-decoded"></i>
          <i data-lucide="pause" id="icon-pause-decoded" class="hidden"></i>
        </button>
        <div id="time-decoded" class="time-disp">0:00</div>
        <input type="range" id="seek-decoded" value="0" max="100" style="flex:1;">
      </div>
      <audio id="decodedAudio" class="hidden" src="${url}"></audio>
    </div>`
  result.classList.remove('hidden')

  if (window.__lucideCreateIcons) window.__lucideCreateIcons()

  const audio = document.getElementById('decodedAudio')
  decodedPlaying = false

  document.getElementById('btn-play-decoded').addEventListener('click', () => {
    if (audio.paused) { audio.play(); decodedPlaying = true }
    else              { audio.pause(); decodedPlaying = false }
    document.getElementById('icon-play-decoded')?.classList.toggle('hidden', decodedPlaying)
    document.getElementById('icon-pause-decoded')?.classList.toggle('hidden', !decodedPlaying)
  })

  document.getElementById('seek-decoded').addEventListener('input', e => {
    if (audio.duration) audio.currentTime = audio.duration * (e.target.value / 100)
  })

  const updateTimeDisplay = () => {
    const td = document.getElementById('time-decoded')
    if (!td) return
    const current = formatTime(audio.currentTime)
    const total   = audio.duration && isFinite(audio.duration) ? formatTime(audio.duration) : '—'
    td.textContent = current + ' / ' + total
  }

  audio.addEventListener('loadedmetadata', updateTimeDisplay)

  audio.addEventListener('timeupdate', () => {
    const pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0
    const sl  = document.getElementById('seek-decoded')
    if (sl) sl.value = pct
    updateTimeDisplay()
  })

  audio.addEventListener('ended', () => {
    decodedPlaying = false
    document.getElementById('icon-play-decoded')?.classList.remove('hidden')
    document.getElementById('icon-pause-decoded')?.classList.add('hidden')
  })
}

function clearDecode() {
  document.getElementById('decodeFile').value = ''
  resetDecodeUI()
  loadedEncryptedBuf = null
  document.getElementById('decode-preview-img').src = ''
  document.getElementById('decode-preview-wrap').classList.add('hidden')
  document.getElementById('dropZone').classList.remove('hidden')
}

function resetDecodeUI() {
  document.getElementById('passwordSection').classList.add('hidden')
  document.getElementById('decodePassword').value = ''
  document.getElementById('decryptResult').innerHTML = ''
  document.getElementById('decryptResult').classList.add('hidden')
  hideError()
  showLoading(false)
}

function showError(msg) {
  document.getElementById('decryptErrorText').textContent = msg
  document.getElementById('decryptError').classList.remove('hidden')
  if (window.__lucideCreateIcons) window.__lucideCreateIcons()
}

function hideError() {
  document.getElementById('decryptError').classList.add('hidden')
}

function showLoading(visible) {
  document.getElementById('decryptLoading').classList.toggle('hidden', !visible)
}
