import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createBarcodeDetector, isValidGtin } from '../lib/barcode'

interface Props {
  onDetected: (barcode: string) => void
  onCancel: () => void
}

/** Caméra arrière + lecture du code-barres en continu ; saisie manuelle du code en secours. */
export function BarcodeScanner({ onDetected, onCancel }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState('')
  const onDetectedRef = useRef(onDetected)
  useLayoutEffect(() => {
    onDetectedRef.current = onDetected
  })

  useEffect(() => {
    let stream: MediaStream | undefined
    let timer: number | undefined
    let stopped = false
    const stop = () => {
      stopped = true
      window.clearTimeout(timer)
      stream?.getTracks().forEach((t) => t.stop())
    }

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("La caméra n'est pas disponible ici. Saisis le code sous la bouteille.")
        return
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        })
        if (stopped) return stop()
        const video = videoRef.current!
        video.srcObject = stream
        await video.play()
        const detector = await createBarcodeDetector()
        if (stopped) return
        setReady(true)
        const tick = async () => {
          if (stopped) return
          try {
            if (video.readyState >= 2) {
              const found = (await detector.detect(video)).find((c) => /^\d{8,14}$/.test(c.rawValue))
              if (found && !stopped) {
                stop()
                navigator.vibrate?.(60)
                onDetectedRef.current(found.rawValue)
                return
              }
            }
          } catch {
            // Image pas encore prête : on réessaie au tour suivant.
          }
          timer = window.setTimeout(tick, 150)
        }
        tick()
      } catch (err) {
        setError(cameraError(err))
      }
    }

    start()
    return stop
  }, [])

  return (
    <div className="stack">
      {!error && (
        <div className="scanner-view">
          <video ref={videoRef} playsInline muted />
          <div className="scanner-frame" aria-hidden="true">
            {ready && <span className="scanner-line" />}
          </div>
        </div>
      )}
      <p className={error ? 'error' : 'muted'} style={{ margin: 0, textAlign: 'center' }}>
        {error ?? (ready ? 'Vise le code-barres de la bouteille.' : 'Ouverture de la caméra…')}
      </p>
      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          const value = code.replace(/\s/g, '')
          if (!isValidGtin(value)) return setCodeError('Ce code ne semble pas valide (8 ou 13 chiffres).')
          onDetectedRef.current(value)
        }}
      >
        <input
          className="input"
          inputMode="numeric"
          placeholder="Ou saisis le code (13 chiffres)"
          value={code}
          onChange={(e) => {
            setCode(e.target.value)
            setCodeError('')
          }}
        />
        <button type="submit" className="btn" disabled={!code.trim()}>
          Chercher
        </button>
      </form>
      {codeError && <p className="error">{codeError}</p>}
      <button type="button" className="btn ghost block" onClick={onCancel}>
        Annuler
      </button>
    </div>
  )
}

function cameraError(err: unknown): string {
  const name = err instanceof DOMException ? err.name : ''
  if (name === 'NotAllowedError') {
    return "Accès à la caméra refusé. Autorise-le dans les réglages du site (cadenas de la barre d'adresse), ou saisis le code."
  }
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'Aucune caméra trouvée. Saisis le code sous la bouteille.'
  return "Impossible d'ouvrir la caméra. Saisis le code sous la bouteille."
}
