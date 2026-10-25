import { useLiveQuery } from 'dexie-react-hooks'
import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { BASE_COCKTAILS } from '../data/cocktails'
import { BASE_INGREDIENTS } from '../data/ingredients'
import type { Cocktail, Ingredient } from '../data/types'
import { estimateAbv, type AbvInfo } from '../lib/abv'
import { db, readSettings, type BottleRow, type Settings } from '../lib/db'
import { checkCocktail, type CocktailCheck } from '../lib/matching'
import { shortName } from '../lib/text'

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
  /** Nombre de recettes classiques supprimées par l'utilisateur. */
  removedCount: number
  settings: Settings
}

const BarContext = createContext<BarState | null>(null)

export function BarProvider({ children }: { children: ReactNode }) {
  const bottles = useLiveQuery(() => db.bottles.orderBy('id').toArray(), [])
  const pantryRows = useLiveQuery(() => db.pantry.toArray(), [])
  const customIngredients = useLiveQuery(() => db.ingredients.toArray(), [])
  const storedCocktails = useLiveQuery(() => db.cocktails.toArray(), [])
  const removedRows = useLiveQuery(() => db.removed.toArray(), [])
  const favoriteRows = useLiveQuery(() => db.favorites.toArray(), [])
  const settings = useLiveQuery(readSettings, [])

  const state = useMemo<BarState | null>(() => {
    if (!bottles || !pantryRows || !customIngredients || !storedCocktails || !removedRows || !favoriteRows || !settings) {
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
    const abvById = new Map(cocktails.map((c) => [c.id, estimateAbv(c, ingredientById)]))

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
      removedCount: removed.size,
      settings,
    }
  }, [bottles, pantryRows, customIngredients, storedCocktails, removedRows, favoriteRows, settings])

  if (!state) return <div className="loading">Chargement du bar…</div>
  return <BarContext.Provider value={state}>{children}</BarContext.Provider>
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
