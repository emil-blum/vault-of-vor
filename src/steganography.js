// LSB steganography — 3 bits per pixel (R, G, B), Alpha channel untouched.

export function embedData(pixels, buffer) {
  let bit = 0
  for (let i = 0; i < pixels.length; i += 4) {
    for (let ch = 0; ch < 3; ch++) {
      if (bit >= buffer.length * 8) return
      const byteI = Math.floor(bit / 8)
      const bitI  = 7 - (bit % 8)
      pixels[i + ch] = (pixels[i + ch] & 0xFE) | ((buffer[byteI] >> bitI) & 1)
      bit++
    }
  }
}

export function extractData(pixels, byteCount) {
  const out = new Uint8Array(byteCount)
  let bit = 0
  for (let i = 0; i < pixels.length; i += 4) {
    for (let ch = 0; ch < 3; ch++) {
      if (bit >= byteCount * 8) return out
      const byteI = Math.floor(bit / 8)
      const bitI  = 7 - (bit % 8)
      if (pixels[i + ch] & 1) out[byteI] |= (1 << bitI)
      bit++
    }
  }
  return out
}
