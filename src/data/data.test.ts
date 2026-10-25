import { describe, expect, it } from 'vitest'
import { BASE_COCKTAILS } from './cocktails'
import { BASE_INGREDIENTS, DEFAULT_PANTRY, FAMILIES, GROUP_BY_ID } from './ingredients'
import { GLASSES, METHODS } from './meta'

const ingredientIds = new Set(BASE_INGREDIENTS.map((i) => i.id))

describe('ingrédients de base', () => {
  it('ont des identifiants uniques', () => {
    expect(ingredientIds.size).toBe(BASE_INGREDIENTS.length)
  })

  it('référencent des rayons, familles et substituts existants', () => {
    for (const i of BASE_INGREDIENTS) {
      expect(GROUP_BY_ID.has(i.group), i.id).toBe(true)
      if (i.family) expect(FAMILIES[i.family], i.id).toBeDefined()
      for (const s of i.substitutes ?? []) {
        expect(ingredientIds.has(s), `${i.id} → ${s}`).toBe(true)
        expect(s).not.toBe(i.id)
      }
    }
    for (const id of DEFAULT_PANTRY) expect(ingredientIds.has(id), id).toBe(true)
  })

  it('ont un degré si et seulement si leur rayon est alcoolisé', () => {
    for (const i of BASE_INGREDIENTS) {
      const alcoholic = GROUP_BY_ID.get(i.group)?.defaultAbv !== undefined
      if (alcoholic) expect(i.abv, i.id).toBeGreaterThan(0)
      else expect(i.abv, i.id).toBeUndefined()
    }
  })

  it('sont tous utilisés par au moins une recette ou comme substitut', () => {
    const used = new Set(BASE_COCKTAILS.flatMap((c) => c.ingredients.map((l) => l.ingredientId)))
    for (const i of BASE_INGREDIENTS) for (const s of i.substitutes ?? []) used.add(s)
    const unused = BASE_INGREDIENTS.filter((i) => !used.has(i.id)).map((i) => i.id)
    expect(unused).toEqual([])
  })
})

describe('cocktails de base', () => {
  it('ont des identifiants et des noms uniques', () => {
    expect(new Set(BASE_COCKTAILS.map((c) => c.id)).size).toBe(BASE_COCKTAILS.length)
    expect(new Set(BASE_COCKTAILS.map((c) => c.name)).size).toBe(BASE_COCKTAILS.length)
  })

  it.each(BASE_COCKTAILS.map((c) => [c.name, c] as const))('%s est complet et cohérent', (_, c) => {
    expect(c.ingredients.length).toBeGreaterThan(0)
    expect(c.ingredients.some((l) => !l.optional)).toBe(true)
    expect(c.steps.length).toBeGreaterThan(0)
    expect(GLASSES[c.glass]).toBeDefined()
    expect(METHODS[c.method]).toBeDefined()
    expect(c.color).toMatch(/^#[0-9A-F]{6}$/i)
    for (const l of c.ingredients) {
      expect(ingredientIds.has(l.ingredientId), l.ingredientId).toBe(true)
      if (l.qty !== undefined) expect(l.qty).toBeGreaterThan(0)
    }
  })
})
