/**
 * Détourage des photos de bouteilles. Le travail est fait par un modèle d'IA (RMBG-1.4) dans un Web Worker
 * (`cutout.worker.ts`) : l'app reste fluide pendant les quelques secondes de calcul.
 */

/** Progression du premier téléchargement du modèle (0 à 1), diffusée sur `window`. */
export const CUTOUT_DOWNLOAD_EVENT = 'mon-bar:detourage-telechargement'

let worker: Worker | undefined
let nextId = 0
const pending = new Map<number, { resolve: (image: string | null) => void }>()

function getWorker(): Worker {
  if (worker) return worker
  worker = new Worker(new URL('./cutout.worker.ts', import.meta.url), { type: 'module' })
  worker.onmessage = ({ data }) => {
    if (data.type === 'download') {
      window.dispatchEvent(new CustomEvent(CUTOUT_DOWNLOAD_EVENT, { detail: data.progress }))
      return
    }
    const request = pending.get(data.id)
    pending.delete(data.id)
    if (data.error) console.warn('Détourage impossible :', data.error)
    request?.resolve(data.error ? null : data.result)
  }
  worker.onerror = (e) => {
    console.warn('Détourage indisponible :', e.message)
    for (const request of pending.values()) request.resolve(null)
    pending.clear()
    worker = undefined
  }
  return worker
}

/** Photo de bouteille détourée et recadrée (data URL), ou `null` si le détourage a échoué. */
export function cutoutBottle(source: Blob | string): Promise<string | null> {
  return new Promise((resolve) => {
    const id = nextId++
    pending.set(id, { resolve })
    getWorker().postMessage({ id, source })
  })
}
