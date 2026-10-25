/**
 * Détourage des photos de bouteilles avec le modèle RMBG-1.4 (BRIA), exécuté dans le navigateur, hors du fil
 * principal pour ne pas figer l'app. Le modèle est téléchargé une fois puis gardé en cache.
 *
 * Avec la carte graphique (WebGPU) et le modèle en demi-précision, une photo prend environ une seconde ; sur le
 * seul processeur c'est plus de dix fois plus lent, d'où une image d'entrée réduite dans ce cas.
 */
import { AutoModel, AutoProcessor, env, RawImage } from '@huggingface/transformers'

env.allowLocalModels = false

const MODEL = 'briaai/RMBG-1.4'
const OUTPUT_HEIGHT = 240
const MAX_WIDTH = 200

interface Request {
  id: number
  source: Blob | string
}

const scope = self as unknown as { postMessage(message: unknown): void; onmessage: ((e: MessageEvent<Request>) => void) | null }

type Loaded = {
  model: Awaited<ReturnType<typeof AutoModel.from_pretrained>>
  processor: Awaited<ReturnType<typeof AutoProcessor.from_pretrained>>
}
let loading: Promise<Loaded> | undefined

interface Backend {
  device: 'webgpu' | 'wasm'
  dtype: 'fp16' | 'q8'
  /** Côté de l'image donnée au modèle (1024 pour la meilleure qualité). */
  size: number
}

type GpuNavigator = { gpu?: { requestAdapter(): Promise<{ features: Set<string> } | null> } }

async function pickBackend(): Promise<Backend> {
  try {
    const adapter = await (navigator as GpuNavigator).gpu?.requestAdapter()
    if (adapter?.features.has('shader-f16')) return { device: 'webgpu', dtype: 'fp16', size: 1024 }
  } catch {
    // Pas de carte graphique utilisable : on passe au processeur.
  }
  return { device: 'wasm', dtype: 'q8', size: 512 }
}

async function load(): Promise<Loaded> {
  const { device, dtype, size } = await pickBackend()
  const progress = (p: { status: string; file?: string; loaded?: number; total?: number }) => {
    if (p.status === 'progress' && p.file?.endsWith('.onnx') && p.total) {
      scope.postMessage({ type: 'download', progress: (p.loaded ?? 0) / p.total })
    }
  }
  return Promise.all([
    AutoModel.from_pretrained(MODEL, { config: { model_type: 'custom' } as never, device, dtype, progress_callback: progress }),
    AutoProcessor.from_pretrained(MODEL, {
      // Configuration du prétraitement de RMBG-1.4 (absente de son dépôt sous une forme lisible par la bibliothèque).
      config: {
        do_normalize: true,
        do_pad: false,
        do_rescale: true,
        do_resize: true,
        image_mean: [0.5, 0.5, 0.5],
        feature_extractor_type: 'ImageFeatureExtractor',
        image_std: [1, 1, 1],
        resample: 2,
        rescale_factor: 1 / 255,
        size: { width: size, height: size },
      } as never,
    }),
  ]).then(([model, processor]) => {
    scope.postMessage({ type: 'download', progress: 1 })
    return { model, processor }
  })
}

scope.onmessage = async ({ data: { id, source } }) => {
  try {
    loading ??= load()
    const { model, processor } = await loading
    let image = source instanceof Blob ? await RawImage.fromBlob(source) : await RawImage.fromURL(source)
    // Une photo de téléphone (12 Mpx) est inutilement lourde : on la ramène à 1024 px de haut au plus.
    if (image.height > 1024) image = await image.resize(Math.round((image.width * 1024) / image.height), 1024)
    const { pixel_values } = await processor(image)
    const { output } = await model({ input: pixel_values })
    const mask = await RawImage.fromTensor(output[0].mul(255).to('uint8')).resize(image.width, image.height)
    const result = await compose(image, mask.data as Uint8ClampedArray)
    scope.postMessage({ type: 'result', id, result })
  } catch (err) {
    scope.postMessage({ type: 'result', id, error: err instanceof Error ? err.message : String(err) })
  }
}

/**
 * Applique le masque, ne garde que la bouteille visée (la forme au centre, s'il y en a plusieurs), recadre et
 * réduit l'image. `null` si le modèle n'a rien trouvé d'exploitable.
 */
async function compose(image: RawImage, alpha: Uint8ClampedArray): Promise<string | null> {
  const { width: w, height: h } = image
  const keep = mainShape(alpha, w, h)
  if (!keep) return null

  const rgba = image.rgba().data
  let minX = w
  let minY = h
  let maxX = 0
  let maxY = 0
  for (let i = 0; i < w * h; i++) {
    const a = keep[i] ? alpha[i] : 0
    rgba[i * 4 + 3] = a < 16 ? 0 : a
    if (a >= 16) {
      const x = i % w
      const y = (i / w) | 0
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }
  const full = new OffscreenCanvas(w, h)
  full.getContext('2d')!.putImageData(new ImageData(rgba as Uint8ClampedArray<ArrayBuffer>, w, h), 0, 0)

  const cropW = maxX - minX + 1
  const cropH = maxY - minY + 1
  const scale = Math.min(OUTPUT_HEIGHT / cropH, MAX_WIDTH / cropW, 1)
  const out = new OffscreenCanvas(Math.max(1, Math.round(cropW * scale)), Math.max(1, Math.round(cropH * scale)))
  const ctx = out.getContext('2d')!
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(full, minX, minY, cropW, cropH, 0, 0, out.width, out.height)
  const blob = await out.convertToBlob({ type: 'image/webp', quality: 0.9 })
  return toDataUrl(blob.type === 'image/webp' ? blob : await out.convertToBlob({ type: 'image/png' }))
}

/** Zones opaques reliées entre elles ; on garde celle du centre (sinon la plus grande), élargie de quelques pixels. */
function mainShape(alpha: Uint8ClampedArray, w: number, h: number): Uint8Array | null {
  const total = w * h
  const label = new Int32Array(total).fill(-1)
  const sizes: number[] = []
  const stack = new Int32Array(total)
  for (let start = 0; start < total; start++) {
    if (alpha[start] < 128 || label[start] !== -1) continue
    const id = sizes.length
    let size = 0
    let top = 0
    stack[top++] = start
    label[start] = id
    while (top > 0) {
      const i = stack[--top]
      size++
      const x = i % w
      for (const n of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w]) {
        if (n >= 0 && n < total && alpha[n] >= 128 && label[n] === -1) {
          label[n] = id
          stack[top++] = n
        }
      }
    }
    sizes.push(size)
  }
  if (sizes.length === 0) return null

  const center = label[((h / 2) | 0) * w + ((w / 2) | 0)]
  const largest = sizes.indexOf(Math.max(...sizes))
  const chosen = center >= 0 && sizes[center] >= sizes[largest] * 0.25 ? center : largest
  const share = sizes[chosen] / total
  if (share < 0.03 || share > 0.97) return null

  // Bouteille collée aux bords gauche et droit : la photo est trop serrée, le « détourage » garderait un rectangle.
  let left = 0
  let right = 0
  for (let y = 0; y < h; y++) {
    if (label[y * w] === chosen) left++
    if (label[y * w + w - 1] === chosen) right++
  }
  if (left > h * 0.4 && right > h * 0.4) return null

  // Masque de la forme choisie, élargi de 3 px pour garder les bords adoucis par le modèle.
  const keep = new Uint8Array(total)
  const radius = 3
  for (let i = 0; i < total; i++) {
    if (label[i] !== chosen) continue
    const x = i % w
    const y = (i / w) | 0
    for (let dy = -radius; dy <= radius; dy++) {
      const yy = y + dy
      if (yy < 0 || yy >= h) continue
      for (let dx = -radius; dx <= radius; dx++) {
        const xx = x + dx
        if (xx >= 0 && xx < w) keep[yy * w + xx] = 1
      }
    }
  }
  return keep
}

function toDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}
