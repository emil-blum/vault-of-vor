import { encryptData }                         from './crypto.js'
import { embedData }                            from './steganography.js'
import { getCompositeImageData, getCapacityBytes, getLoadedImage } from './canvas.js'
import { msgMode, getRecordedBlob }             from './audio.js'
import { playScatter }                          from './effects.js'
import { attachRuneBtn }                        from './runes.js'

export function initEncode() {
  document.getElementById('encodeBtn').addEventListener('click', handleEncode)

  const pwInput = document.getElementById('encodePassword')
  pwInput.addEventListener('input', () => {
    document.getElementById('pw-hint-encode').classList.toggle('hidden', pwInput.value.trim().length > 0)
  })

  document.getElementById('btn-toggle-pw-encode').addEventListener('click', () => {
    const input  = document.getElementById('encodePassword')
    const isText = input.type === 'text'
    input.type   = isText ? 'password' : 'text'
    document.getElementById('pw-eye-encode').classList.toggle('hidden', !isText)
    document.getElementById('pw-eye-off-encode').classList.toggle('hidden', isText)
  })
}

async function handleEncode() {
  if (!getLoadedImage()) {
    showEncodeStatus('Upload an image first.', 'error')
    return
  }

  const password = document.getElementById('encodePassword').value.trim()
  if (!password) {
    document.getElementById('pw-hint-encode').classList.remove('hidden')
    document.getElementById('encodePassword').focus()
    return
  }

  let rawData
  if (msgMode === 'text') {
    const text = document.getElementById('secretText').value
    if (!text.trim()) { showEncodeStatus('Please enter a message.', 'error'); return }
    const bytes = new TextEncoder().encode(text)
    rawData = new Uint8Array(bytes.length + 1)
    rawData[0] = 0x01
    rawData.set(bytes, 1)
  } else {
    const blob = getRecordedBlob()
    if (!blob) { showEncodeStatus('Please record audio first.', 'error'); return }
    const bytes = new Uint8Array(await blob.arrayBuffer())
    rawData = new Uint8Array(bytes.length + 1)
    rawData[0] = 0x02
    rawData.set(bytes, 1)
  }

  const btn          = document.getElementById('encodeBtn')
  const previewWrap  = document.getElementById('encode-preview-wrap')
  const originalHTML = btn.innerHTML
  btn.disabled       = true
  btn.textContent    = 'Encoding…'

  try {
    // Run scatter effect and encryption in parallel — both must finish before download
    const [, encrypted] = await Promise.all([
      playScatter(previewWrap, 800),
      encryptData(rawData, password),
    ])

    const lenHeader = new Uint8Array(4)
    new DataView(lenHeader.buffer).setUint32(0, encrypted.byteLength)
    const payload = new Uint8Array(4 + encrypted.byteLength)
    payload.set(lenHeader, 0)
    payload.set(encrypted, 4)

    const capacity = getCapacityBytes()
    if (payload.byteLength > capacity) {
      throw new Error(
        `Payload too large (${(payload.byteLength / 1024).toFixed(1)} KB). ` +
        `Image capacity is ${(capacity / 1024).toFixed(1)} KB. Use a larger image or shorter message.`
      )
    }

    const { imageData, width, height } = getCompositeImageData()
    embedData(imageData.data, payload)

    const off  = document.createElement('canvas')
    off.width  = width; off.height = height
    off.getContext('2d').putImageData(imageData, 0, 0)

    off.toBlob(blob => {
      const a    = document.createElement('a')
      a.href     = URL.createObjectURL(blob)
      a.download = 'vault-' + Date.now() + '.png'
      a.click()
      URL.revokeObjectURL(a.href)

      btn.textContent = '✓ Saved!'
      setTimeout(() => {
        btn.disabled  = false
        btn.innerHTML = originalHTML
        window.__lucideCreateIcons?.()
        // Re-attach rune effect to the restored button
        attachRuneBtn(btn)
      }, 3000)
    }, 'image/png')

  } catch (e) {
    showEncodeStatus(e.message || 'Encoding failed.', 'error')
    btn.disabled  = false
    btn.innerHTML = originalHTML
    window.__lucideCreateIcons?.()
    attachRuneBtn(btn)
  }
}

function showEncodeStatus(msg, type) {
  const hint = document.getElementById('pw-hint-encode')
  hint.textContent = msg
  hint.classList.remove('hidden')
  if (type === 'error') hint.classList.add('hint-error')
  else hint.classList.remove('hint-error')
}
