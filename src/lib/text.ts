import { UNITS } from '../data/meta'
import type { RecipeLine } from '../data/types'

/** Minuscules sans accents, pour les recherches. */
export function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

const FRACTIONS: Record<string, string> = { '0.25': '¼', '0.5': '½', '0.75': '¾' }

/** « 4,5 » ; avec `fractions`, « ½ » ou « 2¼ » pour les petites quantités. */
export function formatQty(qty: number, fractions = true): string {
  const whole = Math.floor(qty)
  const rest = Math.round((qty - whole) * 100) / 100
  const frac = FRACTIONS[String(rest)]
  if (fractions && frac && whole < 3) return whole === 0 ? frac : `${whole}${frac}`
  return String(Math.round(qty * 100) / 100).replace('.', ',')
}

/** Partie « quantité » d'une ligne de recette : « 4,5 cl », « 2 traits », « ½ », « Compléter »… */
export function formatAmount(line: RecipeLine): string {
  const unit = line.unit ? UNITS[line.unit] : undefined
  // « Compléter » avec une quantité indicative : on affiche la quantité, la ligne précise « pour compléter ».
  if (line.unit === 'top' && line.qty) return `${formatQty(line.qty, false)} cl`
  if (line.qty === undefined) return unit?.one ?? ''
  const label = line.qty > 1 ? unit?.many : unit?.one
  return [formatQty(line.qty, line.unit !== 'cl'), label].filter(Boolean).join(' ')
}

/** Nom sans la précision entre parenthèses : « Liqueur de coco (Malibu…) » → « Liqueur de coco ». */
export function shortName(name: string): string {
  return name.replace(/\s*\([^)]*\)\s*$/, '')
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n > 1 ? many : one}`
}

/** Identifiant aléatoire (crypto.randomUUID n'existe pas hors HTTPS, ex. test sur le réseau local). */
export function makeId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}

export function slugify(s: string): string {
  return normalize(s)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
