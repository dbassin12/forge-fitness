import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { initPwa } from '@/app/pwa'
import { initTheme } from '@/app/theme'
import './styles.css'

initTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

initPwa()
