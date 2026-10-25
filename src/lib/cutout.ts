/**
 * Détourage d'une photo de bouteille, sans service externe : le fond est repéré sur les bords de l'image puis
 * effacé de proche en proche (comme un pot de peinture), en tolérant les dégradés. Fonctionne bien sur un fond
 * uni (photo produit, mur, nappe) ; renvoie `null` si le fond est trop chargé pour donner un résultat propre.
 */

const WORK_SIZE = 360 // côté maximal de l'image analysée
const OUTPUT_HEIGHT = 240 // hauteur de l'image enregistrée
const SEED_TOLERANCE = 52 // écart à la couleur du fond pour démarrer le remplissage
const GLOBAL_TOLERANCE = 62 // écart maximal à la couleur du fond
const LOCAL_TOLERANCE = 24 // écart maximal entre deux pixels voisins (suivi des dégradés)

export async function cutoutBottle(source: Blob | string): Promise<string | null> {
  const bitmap = await loadBitmap(source)
  const scale = Math.min(1, WORK_SIZE / Math.max(bitmap.width, bitmap.height))
  const w = Math.max(1, Math.round(bitmap.width * scale))
  const h = Math.max(1, Math.round(bitmap.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(bitmap, 0, 0, w, h)
  const image = ctx.getImageData(0, 0, w, h)
  const px = image.data

  const background = borderColor(px, w, h)
  if (!background) return null

  const isBackground = floodBackground(px, w, h, background)
  const foreground = keepMainShapes(isBackground, w, h)
  if (!foreground) return null

  // Transparence, avec un bord adouci d'un pixel.
  let minX = w
  let minY = h
  let maxX = 0
  let maxY = 0
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x
      if (!foreground[i]) {
        px[i * 4 + 3] = 0
        continue
      }
      const edge =
        (x > 0 && !foreground[i - 1]) || (x < w - 1 && !foreground[i + 1]) || (y > 0 && !foreground[i - w]) || (y < h - 1 && !foreground[i + w])
      if (edge) px[i * 4 + 3] = 170
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }
  ctx.putImageData(image, 0, 0)

  // Recadrage sur la bouteille, puis mise à la taille d'enregistrement.
  const cropW = maxX - minX + 1
  const cropH = maxY - minY + 1
  const outScale = Math.min(OUTPUT_HEIGHT / cropH, 200 / cropW)
  const out = document.createElement('canvas')
  out.width = Math.max(1, Math.round(cropW * outScale))
  out.height = Math.max(1, Math.round(cropH * outScale))
  const outCtx = out.getContext('2d')!
  outCtx.imageSmoothingQuality = 'high'
  outCtx.drawImage(canvas, minX, minY, cropW, cropH, 0, 0, out.width, out.height)
  const webp = out.toDataURL('image/webp', 0.9)
  return webp.startsWith('data:image/webp') ? webp : out.toDataURL('image/png')
}

async function loadBitmap(source: Blob | string): Promise<ImageBitmap> {
  const blob = typeof source === 'string' ? await (await fetch(source, { mode: 'cors' })).blob() : source
  return createImageBitmap(blob, { imageOrientation: 'from-image' })
}

type Rgb = [number, number, number]

const distance = (px: Uint8ClampedArray, i: number, c: Rgb) => {
  const dr = px[i] - c[0]
  const dg = px[i + 1] - c[1]
  const db = px[i + 2] - c[2]
  return Math.sqrt(dr * dr + dg * dg + db * db)
}

/** Couleur médiane des bords ; `null` si les bords ne sont pas assez uniformes pour être un fond. */
function borderColor(px: Uint8ClampedArray, w: number, h: number): Rgb | null {
  const samples: number[] = []
  for (let x = 0; x < w; x++) samples.push(x, (h - 1) * w + x)
  for (let y = 1; y < h - 1; y++) samples.push(y * w, y * w + w - 1)
  const median = (channel: number) => {
    const values = samples.map((i) => px[i * 4 + channel]).sort((a, b) => a - b)
    return values[values.length >> 1]
  }
  const color: Rgb = [median(0), median(1), median(2)]
  const close = samples.filter((i) => distance(px, i * 4, color) < SEED_TOLERANCE).length
  return close / samples.length >= 0.55 ? color : null
}

/** Remplissage du fond depuis les bords. */
function floodBackground(px: Uint8ClampedArray, w: number, h: number, bg: Rgb): Uint8Array {
  const isBackground = new Uint8Array(w * h)
  const queue = new Int32Array(w * h)
  let head = 0
  let tail = 0
  const seed = (i: number) => {
    if (!isBackground[i] && distance(px, i * 4, bg) < SEED_TOLERANCE) {
      isBackground[i] = 1
      queue[tail++] = i
    }
  }
  for (let x = 0; x < w; x++) {
    seed(x)
    seed((h - 1) * w + x)
  }
  for (let y = 0; y < h; y++) {
    seed(y * w)
    seed(y * w + w - 1)
  }
  while (head < tail) {
    const i = queue[head++]
    const x = i % w
    const neighbors = [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w]
    for (const n of neighbors) {
      if (n < 0 || n >= w * h || isBackground[n]) continue
      const o = n * 4
      const dr = px[o] - px[i * 4]
      const dg = px[o + 1] - px[i * 4 + 1]
      const db = px[o + 2] - px[i * 4 + 2]
      const local = Math.sqrt(dr * dr + dg * dg + db * db)
      if (local < LOCAL_TOLERANCE && distance(px, o, bg) < GLOBAL_TOLERANCE) {
        isBackground[n] = 1
        queue[tail++] = n
      }
    }
  }
  return isBackground
}

/**
 * Garde les formes principales (la bouteille) et supprime les poussières.
 * `null` si le résultat n'a pas l'air d'un objet détouré (presque rien, ou presque toute l'image).
 */
function keepMainShapes(isBackground: Uint8Array, w: number, h: number): Uint8Array | null {
  const total = w * h
  const label = new Int32Array(total).fill(-1)
  const sizes: number[] = []
  const stack = new Int32Array(total)
  for (let start = 0; start < total; start++) {
    if (isBackground[start] || label[start] !== -1) continue
    const id = sizes.length
    let size = 0
    let top = 0
    stack[top++] = start
    label[start] = id
    while (top > 0) {
      const i = stack[--top]
      size++
      const x = i % w
      const neighbors = [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w]
      for (const n of neighbors) {
        if (n >= 0 && n < total && !isBackground[n] && label[n] === -1) {
          label[n] = id
          stack[top++] = n
        }
      }
    }
    sizes.push(size)
  }
  const largest = Math.max(0, ...sizes)
  const keep = sizes.map((s) => s >= largest * 0.15 && s >= total * 0.01)
  const foreground = new Uint8Array(total)
  let count = 0
  for (let i = 0; i < total; i++) {
    if (label[i] >= 0 && keep[label[i]]) {
      foreground[i] = 1
      count++
    }
  }
  const share = count / total
  return share > 0.05 && share < 0.9 && looksLikeBottle(foreground, w, h, count) ? foreground : null
}

/**
 * Une bouteille détourée est plutôt haute et remplit bien son cadre. Un détourage raté (bouteille sombre sur fond
 * sombre, reflets) donne au contraire une forme trouée ou déchiquetée : on préfère alors garder l'icône.
 */
function looksLikeBottle(foreground: Uint8Array, w: number, h: number, count: number): boolean {
  let minX = w
  let minY = h
  let maxX = 0
  let maxY = 0
  for (let i = 0; i < foreground.length; i++) {
    if (!foreground[i]) continue
    const x = i % w
    const y = (i / w) | 0
    if (x < minX) minX = x
    if (x > maxX) maxX = x
    if (y < minY) minY = y
    if (y > maxY) maxY = y
  }
  const boxW = maxX - minX + 1
  const boxH = maxY - minY + 1
  const fill = count / (boxW * boxH)
  return boxH / boxW >= 1.1 && fill >= 0.45
}
