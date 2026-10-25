import Dexie, { type Table } from 'dexie'
import { DEFAULT_PANTRY } from '../data/ingredients'
import type { Cocktail, Ingredient } from '../data/types'

export interface BottleRow {
  id?: number
  ingredientId: string
  /** Marque ou nom de la bouteille (facultatif). */
  label?: string
  addedAt: number
}

export interface PantryRow {
  ingredientId: string
}

/** Recette classique masquée par l'utilisateur. */
export interface RemovedRow {
  id: string
}

/** Recette mise en favori (classique ou perso). */
export interface FavoriteRow {
  id: string
}

export interface Settings {
  almostThreshold: number
}

export const DEFAULT_SETTINGS: Settings = { almostThreshold: 1 }

interface SettingRow {
  key: keyof Settings
  value: Settings[keyof Settings]
}

class BarDatabase extends Dexie {
  bottles!: Table<BottleRow, number>
  pantry!: Table<PantryRow, string>
  /** Ingrédients créés par l'utilisateur. */
  ingredients!: Table<Ingredient, string>
  /** Recettes créées par l'utilisateur, et recettes classiques qu'il a modifiées (même id). */
  cocktails!: Table<Cocktail, string>
  /** Recettes classiques supprimées (restaurables). */
  removed!: Table<RemovedRow, string>
  favorites!: Table<FavoriteRow, string>
  settings!: Table<SettingRow, string>

  constructor() {
    super('mon-bar')
    this.version(3).stores({
      bottles: '++id, ingredientId',
      pantry: 'ingredientId',
      ingredients: 'id',
      cocktails: 'id',
      settings: 'key',
      removed: 'id',
      favorites: 'id',
    })
    this.on('populate', (tx) => {
      tx.table('pantry').bulkAdd(DEFAULT_PANTRY.map((ingredientId) => ({ ingredientId })))
    })
  }
}

export const db = new BarDatabase()

export async function readSettings(): Promise<Settings> {
  const rows = await db.settings.toArray()
  return { ...DEFAULT_SETTINGS, ...Object.fromEntries(rows.map((r) => [r.key, r.value])) }
}
