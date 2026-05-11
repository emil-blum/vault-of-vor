// Image upload and offscreen canvas for steganography.

let loadedImage = null
let loadedImageFile = null

export function getLoadedImage() { return loadedImage }

export function getCapacityBytes() {
  if (!loadedImage) return 0
  return Math.floor((loadedImage.width * loadedImage.height * 3) / 8)
}

export function getCompositeImageData() {
  if (!loadedImage) throw new Error('No image loaded.')
  const off = document.createElement('canvas')
  off.width  = loadedImage.width
  off.height = loadedImage.height
  off.getContext('2d').drawImage(loadedImage, 0, 0)
  return {
    imageData: off.getContext('2d').getImageData(0, 0, loadedImage.width, loadedImage.height),
    width:  loadedImage.width,
    height: loadedImage.height,
  }
}

export function initCanvas() {
  const fileInput = document.getElementById('imgUpload')
  fileInput.addEventListener('change', e => {
    const file = e.target.files[0]
    if (file) loadImageFile(file)
  })

  document.getElementById('btn-clear-image').addEventListener('click', clearImage)

  // Drag onto the whole encode view
  const encodeView = document.getElementById('view-encode')
  encodeView.addEventListener('dragover', e => {
    e.preventDefault()
    document.getElementById('encode-upload-zone').classList.add('drag-over')
  })
  encodeView.addEventListener('dragleave', e => {
    if (!encodeView.contains(e.relatedTarget)) {
      document.getElementById('encode-upload-zone').classList.remove('drag-over')
    }
  })
  encodeView.addEventListener('drop', e => {
    e.preventDefault()
    document.getElementById('encode-upload-zone').classList.remove('drag-over')
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) loadImageFile(file)
  })
}

export function loadImageFile(file) {
  loadedImageFile = file
  const reader = new FileReader()
  reader.onload = evt => {
    const img = new Image()
    img.onload = () => {
      loadedImage = img
      document.getElementById('encode-preview-img').src = evt.target.result
      document.getElementById('encode-file-name').textContent = file.name
      document.getElementById('encode-upload-zone').classList.add('hidden')
      document.getElementById('encode-preview-wrap').classList.remove('hidden')
      updateCapacity()
    }
    img.src = evt.target.result
  }
  reader.readAsDataURL(file)
}

function clearImage() {
  loadedImage     = null
  loadedImageFile = null
  document.getElementById('imgUpload').value = ''
  document.getElementById('encode-preview-img').src = ''
  document.getElementById('encode-upload-zone').classList.remove('hidden')
  document.getElementById('encode-preview-wrap').classList.add('hidden')
  document.getElementById('capacityText').textContent = '—'
}

function updateCapacity() {
  const bytes     = getCapacityBytes()
  const audioSecs = Math.floor(bytes / 2048)
  const mins      = Math.floor(audioSecs / 60)
  const secs      = audioSecs % 60
  const el = document.getElementById('capacityText')
  if (el) el.textContent = `~${(bytes / 1000).toFixed(0)}K chars · ${mins}m ${secs}s audio`
}
