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
  RotateCcw, Copy, Check, Info, Phone,
} from 'lucide'

const icons = {
  Eye, EyeOff, Lock, Unlock, Key,
  Briefcase, Coffee, Share2,
  ShieldCheck, Shield, AlertTriangle, AlertCircle,
  Image, X, Type, Mic, Square, Play, Pause,
  FileDown, Download, Upload,
  Sun, Moon, Monitor,
  RotateCcw, Copy, Check, Info, Phone,
}

import { initCanvas }          from './canvas.js'
import { initAudio, initMsgMode } from './audio.js'
import { initEncode }          from './encode.js'
import { initDecode }          from './decode.js'
import { initWelcome, initTabs, initOfflineDownload, initTheme } from './ui.js'

// Expose icon refresh for dynamically injected content (decode results)
window.__lucideCreateIcons = () => createIcons({ icons })

initTheme()
initWelcome()
initTabs()
initOfflineDownload()
initCanvas()
initAudio()
initMsgMode()
initEncode()
initDecode()

createIcons({ icons })
