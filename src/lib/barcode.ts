/** Codes-barres des produits du commerce. */
const FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e']

export interface DetectedCode {
  rawValue: string
}

export interface Detector {
  detect(source: HTMLVideoElement | ImageBitmap): Promise<DetectedCode[]>
}

interface NativeDetectorClass {
  new (options: { formats: string[] }): Detector
  getSupportedFormats?: () => Promise<string[]>
}

/**
 * Lecteur de codes-barres : celui du navigateur s'il existe (Chrome Android), sinon la bibliothèque ZXing,
 * chargée seulement à ce moment-là pour ne pas alourdir l'app.
 */
export async function createBarcodeDetector(): Promise<Detector> {
  const Native = (globalThis as { BarcodeDetector?: NativeDetectorClass }).BarcodeDetector
  if (Native) {
    const supported = (await Native.getSupportedFormats?.()) ?? FORMATS
    const formats = FORMATS.filter((f) => supported.includes(f))
    if (formats.length > 0) return new Native({ formats })
  }
  const { BarcodeDetector } = await import('barcode-detector/ponyfill')
  return new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] })
}

/** Vérifie la clé de contrôle d'un code EAN-8, UPC-A (12) ou EAN-13 : écarte les lectures erronées. */
export function isValidGtin(code: string): boolean {
  if (!/^(\d{8}|\d{12}|\d{13})$/.test(code)) return false
  const digits = code.split('').map(Number)
  const check = digits.pop()!
  const sum = digits.reverse().reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 3 : 1), 0)
  return (10 - (sum % 10)) % 10 === check
}
