// AES-GCM encryption via Web Crypto API. No external dependencies.

export async function deriveKey(password, salt) {
  const enc = new TextEncoder()
  const km  = await crypto.subtle.importKey(
    'raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    km, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']
  )
}

export async function encryptData(data, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv   = crypto.getRandomValues(new Uint8Array(12))
  const key  = await deriveKey(password, salt)
  const ct   = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data)
  const buf  = new Uint8Array(16 + 12 + ct.byteLength)
  buf.set(salt, 0)
  buf.set(iv, 16)
  buf.set(new Uint8Array(ct), 28)
  return buf
}

export async function decryptData(buf, password) {
  const salt = buf.slice(0, 16)
  const iv   = buf.slice(16, 28)
  const data = buf.slice(28)
  const key  = await deriveKey(password, salt)
  const pt   = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data)
  return new Uint8Array(pt)
}
