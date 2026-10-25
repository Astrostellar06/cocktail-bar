import { BASE_COCKTAILS } from '../data/cocktails'
import { GROUP_BY_ID } from '../data/ingredients'
import type { Cocktail, GroupId, Ingredient } from '../data/types'
import { db, type Settings } from './db'
import { makeId, slugify } from './text'

const BASE_IDS = new Set(BASE_COCKTAILS.map((c) => c.id))

export const isBaseCocktail = (id: string) => BASE_IDS.has(id)

export function addBottle(ingredientId: string, label?: string) {
  return db.bottles.add({ ingredientId, label: label?.trim() || undefined, addedAt: Date.now() })
}

export function updateBottle(id: number, changes: { ingredientId?: string; label?: string }) {
  return db.bottles.update(id, { ...changes, label: changes.label?.trim() || undefined })
}

export function removeBottle(id: number) {
  return db.bottles.delete(id)
}

export async function setPantry(ingredientId: string, present: boolean) {
  if (present) await db.pantry.put({ ingredientId })
  else await db.pantry.delete(ingredientId)
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
