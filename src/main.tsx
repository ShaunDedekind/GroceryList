import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { initListCodeFromSession } from './lib/supabase'
import './index.css'
import App from './App.tsx'

initListCodeFromSession()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
