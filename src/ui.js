import { pauseAll } from './audio.js'

// ─── Welcome (always shown) ──────────────────────────────────────────────────

export function initWelcome() {
  const btn = document.getElementById('btn-welcome-enter')
  if (!btn) {
    // Welcome was already removed (e.g. stale DOM snapshot) — ensure app is visible
    document.getElementById('app')?.classList.add('visible')
    return
  }
  btn.addEventListener('click', dismissWelcome)
}

function dismissWelcome() {
  const el = document.getElementById('welcome')
  el.classList.add('fade-out')
  document.getElementById('app').classList.add('visible')
  setTimeout(() => el.remove(), 500)
}

// ─── Tabs ────────────────────────────────────────────────────────────────────

export function initTabs() {
  document.getElementById('tab-encode').addEventListener('click', () => switchTab('encode'))
  document.getElementById('tab-decode').addEventListener('click', () => switchTab('decode'))
  document.getElementById('tab-guide').addEventListener('click',  () => switchTab('guide'))
}

export function switchTab(name) {
  ;['encode', 'decode', 'guide'].forEach(t => {
    document.getElementById('view-' + t).classList.toggle('active', t === name)
    document.getElementById('tab-' + t).classList.toggle('active', t === name)
  })
  pauseAll()
}

// ─── Theme ───────────────────────────────────────────────────────────────────

const THEMES = ['dark', 'light', 'system']
const THEME_ICONS = { dark: 'theme-icon-dark', light: 'theme-icon-light', system: 'theme-icon-system' }

export function initTheme() {
  let saved = 'dark'
  try { saved = localStorage.getItem('vor_theme') || 'dark' } catch (_) {}
  applyTheme(saved)

  document.getElementById('btn-theme').addEventListener('click', () => {
    const current = document.documentElement.dataset.theme || 'dark'
    const next    = THEMES[(THEMES.indexOf(current) + 1) % THEMES.length]
    applyTheme(next)
    try { localStorage.setItem('vor_theme', next) } catch (_) {}
  })
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme
  Object.entries(THEME_ICONS).forEach(([t, id]) => {
    const el = document.getElementById(id)
    if (el) el.classList.toggle('hidden', t !== theme)
  })
}

// ─── Offline download ────────────────────────────────────────────────────────
// cleanHtml is captured in main.js before any DOM mutations (icon replacement,
// welcome removal, etc.), so the downloaded file is always a pristine copy.

let _cleanHtml = null

export function initOfflineDownload(cleanHtml) {
  _cleanHtml = cleanHtml
  document.getElementById('btn-guide-download').addEventListener('click', downloadOffline)
}

export function downloadOffline() {
  const html = _cleanHtml || '<!DOCTYPE html>\n' + document.documentElement.outerHTML
  const blob = new Blob([html], { type: 'text/html' })
  const a    = document.createElement('a')
  a.href     = URL.createObjectURL(blob)
  a.download = 'vault-of-vor.html'
  a.click()
  URL.revokeObjectURL(a.href)
}

// ─── Utilities ───────────────────────────────────────────────────────────────

export function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
