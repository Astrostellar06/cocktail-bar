import type { Cocktail, Ingredient, RecipeLine } from '../data/types'

export type LineStatus = 'ok' | 'substitut' | 'manquant'
export type CocktailStatus = 'faisable' | 'presque' | 'autre'

export interface LineCheck {
  line: RecipeLine
  status: LineStatus
  /** Ingrédient du bar utilisé à la place, si status === 'substitut'. */
  substituteId?: string
}

export interface CocktailCheck {
  cocktail: Cocktail
  lines: LineCheck[]
  /** Ingrédients obligatoires manquants (sans doublon). */
  missing: string[]
  usesSubstitute: boolean
  status: CocktailStatus
}

export function checkLine(line: RecipeLine, owned: Set<string>, ingredients: Map<string, Ingredient>): LineCheck {
  if (owned.has(line.ingredientId)) return { line, status: 'ok' }
  const subs = ingredients.get(line.ingredientId)?.substitutes ?? []
  const substituteId = subs.find((id) => owned.has(id))
  if (substituteId) return { line, status: 'substitut', substituteId }
  return { line, status: 'manquant' }
}

/**
 * @param almostThreshold nombre maximal d'ingrédients manquants pour être « presque faisable ».
 */
export function checkCocktail(
  cocktail: Cocktail,
  owned: Set<string>,
  ingredients: Map<string, Ingredient>,
  almostThreshold: number,
): CocktailCheck {
  const lines = cocktail.ingredients.map((line) => checkLine(line, owned, ingredients))
  const required = lines.filter((l) => !l.line.optional)
  const missing = [...new Set(required.filter((l) => l.status === 'manquant').map((l) => l.line.ingredientId))]
  const usesSubstitute = required.some((l) => l.status === 'substitut')
  const status: CocktailStatus =
    missing.length === 0 ? 'faisable' : missing.length <= almostThreshold ? 'presque' : 'autre'
  return { cocktail, lines, missing, usesSubstitute, status }
}

export interface PurchaseSuggestion {
  ingredientId: string
  /** Cocktails qui deviennent faisables avec ce seul achat. */
  unlocks: Cocktail[]
}

/** Classe les ingrédients manquants selon le nombre de cocktails qu'ils débloquent à eux seuls. */
export function purchaseSuggestions(checks: CocktailCheck[]): PurchaseSuggestion[] {
  const byIngredient = new Map<string, Cocktail[]>()
  for (const check of checks) {
    if (check.missing.length !== 1) continue
    const id = check.missing[0]
    byIngredient.set(id, [...(byIngredient.get(id) ?? []), check.cocktail])
  }
  return [...byIngredient.entries()]
    .map(([ingredientId, unlocks]) => ({ ingredientId, unlocks }))
    .sort((a, b) => b.unlocks.length - a.unlocks.length || a.ingredientId.localeCompare(b.ingredientId))
}

/** Filtre « par ingrédient » : un id d'ingrédient, ou « f:famille » pour toute une famille. */
export function containsFilter(cocktail: Cocktail, filter: string, ingredients: Map<string, Ingredient>): boolean {
  if (filter.startsWith('f:')) {
    const family = filter.slice(2)
    return cocktail.ingredients.some((l) => ingredients.get(l.ingredientId)?.family === family)
  }
  return cocktail.ingredients.some((l) => l.ingredientId === filter)
}
