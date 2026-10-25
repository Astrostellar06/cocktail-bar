import { BASE_COCKTAILS } from '../data/cocktails'
import { GROUP_BY_ID } from '../data/ingredients'
import type { Cocktail, GroupId, Ingredient } from '../data/types'
import { db, type Settings } from './db'
import { makeId, slugify } from './text'

const BASE_IDS = new Set(BASE_COCKTAILS.map((c) => c.id))

export const isBaseCocktail = (id: string) => BASE_IDS.has(id)

export interface BottleDetails {
  label?: string
  abv?: number
  image?: string
  barcode?: string
}

/** Ajoute une bouteille au bar ; l'ingrédient sort de la liste de courses. */
export async function addBottle(ingredientId: string, details: BottleDetails = {}): Promise<number> {
  return db.transaction('rw', db.bottles, db.shopping, async () => {
    await db.shopping.delete(ingredientId)
    return db.bottles.add({ ingredientId, ...cleanDetails(details), addedAt: Date.now() })
  })
}

/** Ne modifie que les champs fournis (un champ fourni vide est effacé). */
export function updateBottle(id: number, changes: BottleDetails & { ingredientId?: string }) {
  const clean = cleanDetails(changes)
  const update = Object.fromEntries(
    Object.keys(changes).map((key) => [key, key in clean ? clean[key as keyof BottleDetails] : changes[key as 'ingredientId']]),
  )
  return db.bottles.update(id, update)
}

/** Champs vides → absents (le degré vide reprend celui du type d'ingrédient). */
function cleanDetails({ label, abv, image, barcode }: BottleDetails): BottleDetails {
  return {
    label: label?.trim() || undefined,
    abv: abv !== undefined && Number.isFinite(abv) && abv > 0 ? abv : undefined,
    image: image || undefined,
    barcode: barcode || undefined,
  }
}

export function removeBottle(id: number) {
  return db.bottles.delete(id)
}

export async function setPantry(ingredientId: string, present: boolean) {
  await db.transaction('rw', db.pantry, db.shopping, async () => {
    if (present) {
      await db.pantry.put({ ingredientId })
      await db.shopping.delete(ingredientId)
    } else {
      await db.pantry.delete(ingredientId)
    }
  })
}

/** Ajoute ou retire un ingrédient de la liste de courses. */
export async function setShopping(ingredientId: string, wanted: boolean) {
  if (wanted) await db.shopping.put({ ingredientId, addedAt: Date.now() })
  else await db.shopping.delete(ingredientId)
}

/** « Je l'ai » : ajoute une bouteille ou coche le garde-manger selon le rayon. */
export function acquire(ingredient: Ingredient) {
  return GROUP_BY_ID.get(ingredient.group)?.kind === 'bouteille'
    ? addBottle(ingredient.id)
    : setPantry(ingredient.id, true)
}

export async function createIngredient(name: string, group: GroupId, abv?: number): Promise<Ingredient> {
  const ingredient: Ingredient = {
    id: makeId(`perso-${slugify(name) || 'ingredient'}`),
    name: name.trim(),
    group,
    ...(abv && { abv }),
    custom: true,
  }
  await db.ingredients.add(ingredient)
  return ingredient
}

/** Modifie un ingrédient créé par l'utilisateur (les ingrédients de base ne sont pas modifiables). */
export async function updateIngredient(id: string, changes: { name: string; group: GroupId; abv?: number }) {
  await db.ingredients.update(id, { name: changes.name.trim(), group: changes.group, abv: changes.abv || undefined })
}

/** Enregistre une création, ou la version modifiée d'une recette classique (même id que l'originale). */
export async function saveCocktail(cocktail: Cocktail) {
  const base = isBaseCocktail(cocktail.id)
  await db.cocktails.put({
    ...cocktail,
    custom: base ? undefined : true,
    edited: base ? true : undefined,
    updatedAt: Date.now(),
  })
}

/** Supprime une création, ou masque une recette classique (restaurable depuis les réglages). */
export async function deleteCocktail(id: string) {
  await db.transaction('rw', db.cocktails, db.removed, db.favorites, async () => {
    await db.cocktails.delete(id)
    // Une classique supprimée garde son favori : il revient si on la restaure.
    if (isBaseCocktail(id)) await db.removed.put({ id })
    else await db.favorites.delete(id)
  })
}

/** Annule les modifications faites sur une recette classique. */
export function restoreOriginal(id: string) {
  return db.cocktails.delete(id)
}

/** Fait réapparaître toutes les recettes classiques supprimées. */
export function restoreRemoved() {
  return db.removed.clear()
}

export async function setFavorite(id: string, favorite: boolean) {
  if (favorite) await db.favorites.put({ id })
  else await db.favorites.delete(id)
}

export function saveSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
  return db.settings.put({ key, value })
}
