import Dexie, { type DBCore, type Middleware, type Table } from 'dexie'
import { DEFAULT_PANTRY } from '../data/ingredients'
import type { Cocktail, Ingredient } from '../data/types'

export interface BottleRow {
  id?: number
  ingredientId: string
  /** Marque ou nom de la bouteille (facultatif). */
  label?: string
  /** Degré de cette bouteille, s'il diffère de celui du type (ex. un whisky à 46 %). */
  abv?: number
  /** Visuel détouré (data URL), obtenu par scan ou photo. */
  image?: string
  /** Code-barres scanné. */
  barcode?: string
  addedAt: number
}

export interface PantryRow {
  ingredientId: string
}

/** Ingrédient à acheter. */
export interface ShoppingRow {
  ingredientId: string
  addedAt: number
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
  shopping!: Table<ShoppingRow, string>
  settings!: Table<SettingRow, string>

  constructor() {
    super('mon-bar')
    this.version(4).stores({
      bottles: '++id, ingredientId',
      pantry: 'ingredientId',
      ingredients: 'id',
      cocktails: 'id',
      settings: 'key',
      removed: 'id',
      favorites: 'id',
      shopping: 'ingredientId, addedAt',
    })
    this.on('populate', (tx) => {
      tx.table('pantry').bulkAdd(DEFAULT_PANTRY.map((ingredientId) => ({ ingredientId })))
    })
    this.use(stuckWriteWatchdog)
  }
}

/** Événement émis quand une écriture n'aboutit pas : la base est verrouillée par un autre onglet. */
export const STUCK_WRITE_EVENT = 'mon-bar:ecriture-bloquee'
const STUCK_AFTER_MS = 4000

/**
 * Surveille chaque écriture. Une écriture qui ne se termine pas attend un verrou tenu ailleurs, typiquement un
 * onglet Chrome mis en pause par Android au milieu d'une lecture : l'écran l'afficherait, mais elle serait perdue.
 */
const stuckWriteWatchdog: Middleware<DBCore> = {
  stack: 'dbcore',
  name: 'stuckWriteWatchdog',
  create: (down) => ({
    ...down,
    table: (name) => {
      const table = down.table(name)
      return {
        ...table,
        mutate: (req) => {
          const timer = setTimeout(() => window.dispatchEvent(new Event(STUCK_WRITE_EVENT)), STUCK_AFTER_MS)
          return table.mutate(req).finally(() => clearTimeout(timer))
        },
      }
    },
  }),
}

export const db = new BarDatabase()

export async function readSettings(): Promise<Settings> {
  const rows = await db.settings.toArray()
  return { ...DEFAULT_SETTINGS, ...Object.fromEntries(rows.map((r) => [r.key, r.value])) }
}
