import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { BASE_COCKTAILS } from '../data/cocktails'
import { BASE_INGREDIENTS } from '../data/ingredients'
import type { Cocktail, Ingredient } from '../data/types'
import { estimateAbv, type AbvInfo } from '../lib/abv'
import { db, readSettings, type BottleRow, type Settings, type ShoppingRow } from '../lib/db'
import { checkCocktail, type CocktailCheck } from '../lib/matching'
import { shortName } from '../lib/text'
import { usePageVisible, usePausableLiveQuery } from './liveQuery'

export interface BarState {
  bottles: BottleRow[]
  /** Ingrédients cochés dans le garde-manger. */
  pantry: Set<string>
  /** Tout ce qui est disponible : bouteilles + garde-manger + ingrédients toujours disponibles. */
  owned: Set<string>
  ingredients: Ingredient[]
  ingredientById: Map<string, Ingredient>
  cocktails: Cocktail[]
  cocktailById: Map<string, Cocktail>
  checks: CocktailCheck[]
  checkById: Map<string, CocktailCheck>
  abvById: Map<string, AbvInfo>
  /** Identifiants des recettes en favori. */
  favorites: Set<string>
  /** Ingrédients de la liste de courses, du plus récent au plus ancien. */
  shopping: ShoppingRow[]
  shoppingIds: Set<string>
  /** Nombre de recettes classiques supprimées par l'utilisateur. */
  removedCount: number
  settings: Settings
}

const BarContext = createContext<BarState | null>(null)

export function BarProvider({ children }: { children: ReactNode }) {
  const visible = usePageVisible()
  const bottles = usePausableLiveQuery(() => db.bottles.orderBy('id').toArray(), visible)
  const pantryRows = usePausableLiveQuery(() => db.pantry.toArray(), visible)
  const customIngredients = usePausableLiveQuery(() => db.ingredients.toArray(), visible)
  const storedCocktails = usePausableLiveQuery(() => db.cocktails.toArray(), visible)
  const removedRows = usePausableLiveQuery(() => db.removed.toArray(), visible)
  const favoriteRows = usePausableLiveQuery(() => db.favorites.toArray(), visible)
  const shopping = usePausableLiveQuery(() => db.shopping.orderBy('addedAt').reverse().toArray(), visible)
  const settings = usePausableLiveQuery(readSettings, visible)

  const state = useMemo<BarState | null>(() => {
    if (!bottles || !pantryRows || !customIngredients || !storedCocktails || !removedRows || !favoriteRows || !shopping || !settings) {
      return null
    }

    const ingredients = [...BASE_INGREDIENTS, ...customIngredients]
    const ingredientById = new Map(ingredients.map((i) => [i.id, i]))
    const pantry = new Set(pantryRows.map((p) => p.ingredientId))
    const owned = new Set([
      ...pantry,
      ...bottles.map((b) => b.ingredientId),
      ...ingredients.filter((i) => i.always).map((i) => i.id),
    ])

    // Les classiques modifiés sont stockés avec le même id que l'original et le remplacent.
    const stored = new Map(storedCocktails.map((c) => [c.id, c]))
    const removed = new Set(removedRows.map((r) => r.id))
    const baseIds = new Set(BASE_COCKTAILS.map((c) => c.id))
    const cocktails = [
      ...BASE_COCKTAILS.filter((c) => !removed.has(c.id)).map((c) => stored.get(c.id) ?? c),
      ...storedCocktails.filter((c) => !baseIds.has(c.id)),
    ]
    const cocktailById = new Map(cocktails.map((c) => [c.id, c]))
    const checks = cocktails.map((c) => checkCocktail(c, owned, ingredientById, settings.almostThreshold))
    const checkById = new Map(checks.map((c) => [c.cocktail.id, c]))
    const abvById = new Map(cocktails.map((c) => [c.id, estimateAbv(c, withBottleStrengths(ingredientById, bottles))]))

    return {
      bottles,
      pantry,
      owned,
      ingredients,
      ingredientById,
      cocktails,
      cocktailById,
      checks,
      checkById,
      abvById,
      favorites: new Set(favoriteRows.map((f) => f.id)),
      shopping,
      shoppingIds: new Set(shopping.map((r) => r.ingredientId)),
      removedCount: removed.size,
      settings,
    }
  }, [bottles, pantryRows, customIngredients, storedCocktails, removedRows, favoriteRows, shopping, settings])

  if (!state) return <div className="loading">Chargement du bar…</div>
  return <BarContext.Provider value={state}>{children}</BarContext.Provider>
}

/**
 * Ingrédients avec le degré réel des bouteilles du bar : si un whisky est à 46 % au lieu de 40 %, les cocktails
 * qui l'utilisent en tiennent compte (moyenne s'il y a plusieurs bouteilles du même type).
 */
function withBottleStrengths(ingredientById: Map<string, Ingredient>, bottles: BottleRow[]): Map<string, Ingredient> {
  if (!bottles.some((b) => b.abv !== undefined)) return ingredientById
  const result = new Map(ingredientById)
  for (const [id, ingredient] of ingredientById) {
    const own = bottles.filter((b) => b.ingredientId === id)
    if (!own.some((b) => b.abv !== undefined)) continue
    const strengths = own.map((b) => b.abv ?? ingredient.abv ?? 0)
    result.set(id, { ...ingredient, abv: strengths.reduce((a, b) => a + b, 0) / strengths.length })
  }
  return result
}

export function useBar(): BarState {
  const state = useContext(BarContext)
  if (!state) throw new Error('useBar doit être utilisé dans <BarProvider>')
  return state
}

/** Nom affichable d'un ingrédient, même s'il a disparu (recette importée, ingrédient supprimé…). */
export function useIngredientName(short = false) {
  const { ingredientById } = useBar()
  return (id: string) => {
    const name = ingredientById.get(id)?.name ?? id
    return short ? shortName(name) : name
  }
}
