import type { Cocktail, GlassId, Ingredient, MethodId, UnitId } from '../data/types'

export interface AbvInfo {
  /** Degré estimé du cocktail servi, en % vol. */
  abv: number
  alcoholFree: boolean
}

/** Volume approximatif (cl) d'une unité ; les solides (sucre, feuilles…) sont ignorés. */
const UNIT_VOLUME: Partial<Record<UnitId, number>> = { cl: 1, trait: 0.1, goutte: 0.005, cuillere: 0.5, cac: 0.5 }

/** Volume supposé d'un « compléter » sans quantité, selon le verre. */
const TOP_VOLUME: Record<GlassId, number> = {
  coupe: 5,
  martini: 5,
  tumbler: 6,
  highball: 10,
  flute: 8,
  vin: 10,
  mug: 10,
  tiki: 10,
  hurricane: 10,
  shot: 2,
  irish: 10,
}

/**
 * Eau apportée par la glace, en fraction du volume mélangé.
 * Shaker et verre à mélange : formules de Dave Arnold (Liquid Intelligence), selon le degré de départ.
 */
function dilution(method: MethodId, glass: GlassId, startAbv: number): number {
  // Shot et Irish coffee : servis sans glace.
  if (glass === 'shot' || glass === 'irish') return 0
  const stirred = -1.21 * startAbv ** 2 + 1.246 * startAbv + 0.145
  switch (method) {
    case 'shaker':
      return 1.567 * startAbv ** 2 + 1.742 * startAbv + 0.203
    case 'melange':
      return stirred
    case 'blender':
      return 0.3
    case 'construit':
      // Servi sur glace et peu remué : environ la moitié de la dilution d'un verre à mélange.
      return stirred / 2
  }
}

type AbvInput = Pick<Cocktail, 'ingredients' | 'method' | 'glass' | 'abv'>

/** Degré d'un cocktail : la valeur saisie à la main si elle existe, sinon une estimation (ingrédients facultatifs exclus). */
export function estimateAbv(cocktail: AbvInput, ingredients: Map<string, Ingredient>): AbvInfo {
  const strength = (id: string) => ingredients.get(id)?.abv ?? 0

  if (cocktail.abv !== undefined) return { abv: cocktail.abv, alcoholFree: cocktail.abv === 0 }
  if (cocktail.ingredients.every((l) => strength(l.ingredientId) === 0)) return { abv: 0, alcoholFree: true }

  // Le « compléter » est ajouté après le shaker ou le verre à mélange : il n'est pas dilué.
  let mixed = 0
  let mixedAlcohol = 0
  let topped = 0
  let toppedAlcohol = 0
  for (const line of cocktail.ingredients) {
    if (line.optional) continue
    const isTop = line.unit === 'top'
    const volume = isTop ? (line.qty ?? TOP_VOLUME[cocktail.glass]) : (line.qty ?? 0) * (UNIT_VOLUME[line.unit ?? 'piece'] ?? 0)
    const alcohol = (volume * strength(line.ingredientId)) / 100
    if (isTop) {
      topped += volume
      toppedAlcohol += alcohol
    } else {
      mixed += volume
      mixedAlcohol += alcohol
    }
  }

  const total = mixed + topped
  if (total === 0) return { abv: 0, alcoholFree: false }
  const alcohol = mixedAlcohol + toppedAlcohol
  const water =
    cocktail.method === 'construit'
      ? total * dilution('construit', cocktail.glass, alcohol / total)
      : mixed * dilution(cocktail.method, cocktail.glass, mixed ? mixedAlcohol / mixed : 0)
  return { abv: (alcohol / (total + water)) * 100, alcoholFree: false }
}

export function formatAbv({ abv, alcoholFree }: AbvInfo): string {
  if (alcoholFree) return 'Sans alcool'
  // Espaces insécables : « ≈ 15 % » ne doit pas se couper en fin de ligne.
  if (abv < 1) return '< 1 %'
  return `≈ ${Math.round(abv)} %`
}
