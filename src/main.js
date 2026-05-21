import '@fontsource-variable/manrope'
import '@fontsource-variable/jetbrains-mono'
import './style.css'

import {
  createIcons,
  Eye, EyeOff, Lock, Unlock, Key,
  ShieldCheck, Shield, AlertTriangle, AlertCircle,
  Image, X, Type, Mic, Square, Play, Pause,
  FileDown, FileText, Download, Upload,
  Sun, Moon, Monitor,
  RotateCcw, Copy, Check, Info, CircleHelp,
} from 'lucide'

const icons = {
  Eye, EyeOff, Lock, Unlock, Key,
  ShieldCheck, Shield, AlertTriangle, AlertCircle,
  Image, X, Type, Mic, Square, Play, Pause,
  FileDown, FileText, Download, Upload,
  Sun, Moon, Monitor,
  RotateCcw, Copy, Check, Info, CircleHelp,
}

import heroLandscape from './assets/hero-landscape.webp'
import heroPortrait  from './assets/hero-portrait.webp'
import heroMobile    from './assets/hero-mobile.webp'

import { initCanvas }                from './canvas.js'
import { initAudio, initMsgMode }   from './audio.js'
import { initEncode }               from './encode.js'
import { initDecode }               from './decode.js'
import { initWelcome, initTabs, initOfflineDownload, initTheme } from './ui.js'
import { initRuneTargets, initRuneButtons } from './runes.js'

// Set hero images from inlined assets
const welcomeImg = document.getElementById('welcome-hero-img')
welcomeImg.src = window.matchMedia('(max-width: 768px)').matches ? heroMobile : heroLandscape
document.getElementById('hero-portrait-img').src = heroPortrait

// Expose icon refresh for dynamically injected content
window.__lucideCreateIcons = () => createIcons({ icons })

// Apply saved theme before snapshot
initTheme()

// Capture clean pre-mutation HTML for offline download
const cleanHtml = '<!DOCTYPE html>\n' + document.documentElement.outerHTML

initOfflineDownload(cleanHtml)
initWelcome()
initTabs()
initCanvas()
initAudio()
initMsgMode()
initEncode()
initDecode()

// Replace <i data-lucide> placeholders — must be last before runes
createIcons({ icons })

// Rune animations — after icons are replaced so spans are stable
initRuneTargets()
initRuneButtons()
