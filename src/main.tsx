import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { ToastProvider } from './components/Toast'
import { BarProvider } from './state/BarContext'
import './styles/global.css'

// Demande au navigateur de ne pas effacer les données locales en cas de manque d'espace.
navigator.storage?.persist?.()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <BarProvider>
        <App />
      </BarProvider>
    </ToastProvider>
  </StrictMode>,
)
