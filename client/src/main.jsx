import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// GSAP plugin registration (moved out of the Next.js layout.tsx).
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Draggable } from 'gsap/Draggable'
import { SplitText } from 'gsap/SplitText'
import InertiaPlugin from 'gsap/InertiaPlugin'
import DrawSVGPlugin from 'gsap/DrawSVGPlugin'
gsap.registerPlugin(ScrollTrigger, Draggable, SplitText, InertiaPlugin, DrawSVGPlugin)

import './globals.css'
import './index.css'
import App from './App.jsx'
import PageTransition from './components/PageTransition'
import CustomCursor from './components/CustomCursor'
import { Analytics } from '@vercel/analytics/react'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <PageTransition />
    <CustomCursor />
    <Analytics />
  </StrictMode>,
)
