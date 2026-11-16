import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/aileron/400.css'
import '@fontsource/aileron/600.css'
import '@fontsource/aileron/700.css'
import '@fontsource/bluu-next/700.css'
import { initListCodeFromSession } from './lib/supabase'
import './index.css'
import App from './App.tsx'

initListCodeFromSession()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
