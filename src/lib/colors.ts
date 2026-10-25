const PASTELS = ['#FFE58A', '#FFC2E0', '#A6EDE4', '#C7D7FF', '#FFD0AE', '#DCCBFF', '#CDEFA8']

/** Couleur de fond stable pour un identifiant donné. */
export function pastelFor(id: string): string {
  let hash = 0
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) | 0
  return PASTELS[Math.abs(hash) % PASTELS.length]
}
