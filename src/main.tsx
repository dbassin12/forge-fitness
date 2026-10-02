import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { initPwa } from '@/app/pwa'
import { initTheme } from '@/app/theme'
import { speech } from '@/voice/speech'
import './styles.css'

initTheme()
speech.init()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

initPwa()
