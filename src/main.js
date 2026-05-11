import '@fontsource-variable/manrope'
import './style.css'
import {
  createIcons,
  Eye, EyeOff, Lock, Unlock, Key,
  Briefcase, Coffee, Share2,
  ShieldCheck, Shield, AlertTriangle, AlertCircle,
  Image, X, Type, Mic, Square, Play, Pause,
  FileDown, Download, Upload,
  Sun, Moon, Monitor,
  RotateCcw, Copy, Check, Info, Phone, CircleHelp,
} from 'lucide'

const icons = {
  Eye, EyeOff, Lock, Unlock, Key,
  Briefcase, Coffee, Share2,
  ShieldCheck, Shield, AlertTriangle, AlertCircle,
  Image, X, Type, Mic, Square, Play, Pause,
  FileDown, Download, Upload,
  Sun, Moon, Monitor,
  RotateCcw, Copy, Check, Info, Phone, CircleHelp,
}

import { initCanvas }                from './canvas.js'
import { initAudio, initMsgMode }   from './audio.js'
import { initEncode }               from './encode.js'
import { initDecode }               from './decode.js'
import { initWelcome, initTabs, initOfflineDownload, initTheme } from './ui.js'

// Expose icon refresh for dynamically injected content (decode results)
window.__lucideCreateIcons = () => createIcons({ icons })

// Apply saved theme first so it's in the outerHTML snapshot
initTheme()

// Capture the clean pre-mutation HTML — before createIcons replaces <i> tags,
// before dismissWelcome removes #welcome, before any class changes.
// This is what gets saved as the offline file.
const cleanHtml = '<!DOCTYPE html>\n' + document.documentElement.outerHTML

initOfflineDownload(cleanHtml)
initWelcome()
initTabs()
initCanvas()
initAudio()
initMsgMode()
initEncode()
initDecode()

// Replace <i data-lucide> placeholders with SVGs — must be last
createIcons({ icons })
