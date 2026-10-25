import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react'

/** Marge ignorée de chaque côté de l'écran : ce sont les zones du geste « retour » d'Android. */
const EDGE = 24

interface Options {
  enabled: boolean
  /** Onglet affiché : 0 = Mon bar, 1 = Cocktails. */
  section: 0 | 1
  /** Appelé quand le geste est validé. */
  onSwitch: (to: 0 | 1) => void
}

/**
 * Balayage horizontal entre les deux onglets. La page suit le doigt, puis part sur le côté si le geste est assez
 * long ou rapide. La progression est publiée dans la variable CSS `--swipe` de `.app` pour que l'indicateur de la
 * barre d'onglets suive le geste.
 */
export function useTabSwipe(ref: RefObject<HTMLElement | null>, { enabled, section, onSwitch }: Options) {
  const onSwitchRef = useRef(onSwitch)
  useLayoutEffect(() => {
    onSwitchRef.current = onSwitch
  })

  useEffect(() => {
    const page = ref.current
    const app = page?.closest<HTMLElement>('.app')
    if (!page || !app || !enabled) return

    let mode: 'idle' | 'pending' | 'swipe' | 'scroll' = 'idle'
    let startX = 0
    let startY = 0
    let startTime = 0
    let dx = 0

    const width = () => page.offsetWidth || window.innerWidth
    // Balayer vers la gauche mène à « Cocktails », vers la droite à « Mon bar ».
    const allowed = (delta: number) => (delta < 0 ? section === 0 : section === 1)

    const setProgress = (progress: number) => app.style.setProperty('--swipe', String(progress))

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return
      const t = e.touches[0]
      if (t.clientX < EDGE || t.clientX > window.innerWidth - EDGE) return
      if ((e.target as Element).closest('input, textarea, select')) return
      mode = 'pending'
      startX = t.clientX
      startY = t.clientY
      startTime = performance.now()
      dx = 0
    }

    const onMove = (e: TouchEvent) => {
      if (mode !== 'pending' && mode !== 'swipe') return
      const t = e.touches[0]
      const moveX = t.clientX - startX
      const moveY = t.clientY - startY
      if (mode === 'pending') {
        if (Math.abs(moveX) < 10 && Math.abs(moveY) < 10) return
        mode = Math.abs(moveX) > Math.abs(moveY) * 1.3 ? 'swipe' : 'scroll'
        if (mode === 'scroll') return
        page.style.transition = 'none'
        app.dataset.swiping = ''
      }
      if (e.cancelable) e.preventDefault()
      // Rien de ce côté : la page résiste.
      dx = allowed(moveX) ? moveX : moveX / 5
      page.style.transform = `translateX(${dx}px)`
      page.style.opacity = String(1 - Math.min(Math.abs(dx) / width(), 1) * 0.35)
      setProgress(allowed(dx) ? Math.max(-1, Math.min(1, -dx / width())) : 0)
    }

    const onEnd = () => {
      if (mode !== 'swipe') {
        mode = 'idle'
        return
      }
      mode = 'idle'
      delete app.dataset.swiping
      const speed = Math.abs(dx) / Math.max(1, performance.now() - startTime)
      const validated = allowed(dx) && (Math.abs(dx) > width() * 0.25 || (speed > 0.5 && Math.abs(dx) > 40))
      page.style.transition = 'transform 0.18s ease-in, opacity 0.18s ease-in'
      if (validated) {
        page.style.transform = `translateX(${dx < 0 ? -width() : width()}px)`
        page.style.opacity = '0'
        setProgress(dx < 0 ? 1 : -1)
        window.setTimeout(() => onSwitchRef.current(section === 0 ? 1 : 0), 160)
      } else {
        page.style.transform = ''
        page.style.opacity = ''
        setProgress(0)
      }
    }

    page.addEventListener('touchstart', onStart, { passive: true })
    page.addEventListener('touchmove', onMove, { passive: false })
    page.addEventListener('touchend', onEnd)
    page.addEventListener('touchcancel', onEnd)
    return () => {
      page.removeEventListener('touchstart', onStart)
      page.removeEventListener('touchmove', onMove)
      page.removeEventListener('touchend', onEnd)
      page.removeEventListener('touchcancel', onEnd)
    }
  }, [ref, enabled, section])
}
