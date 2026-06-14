import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Attacks from './Attacks.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Attacks />
  </StrictMode>,
)
