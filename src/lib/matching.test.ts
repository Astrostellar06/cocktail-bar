import { describe, expect, it } from 'vitest'
import { BASE_COCKTAILS } from '../data/cocktails'
import { BASE_INGREDIENTS } from '../data/ingredients'
import { checkCocktail, containsFilter, purchaseSuggestions } from './matching'
import { formatAmount, formatQty, shortName } from './text'

const byId = new Map(BASE_INGREDIENTS.map((i) => [i.id, i]))
const cocktail = (id: string) => BASE_COCKTAILS.find((c) => c.id === id)!
const check = (id: string, owned: string[], threshold = 1) => checkCocktail(cocktail(id), new Set(owned), byId, threshold)

describe('checkCocktail', () => {
  it('est faisable quand tout est là, sans compter les décorations', () => {
    const res = check('mojito', ['rhum-blanc', 'citron-vert', 'sucre', 'menthe', 'eau-gazeuse'])
    expect(res.status).toBe('faisable')
    expect(res.missing).toEqual([])
    expect(res.usesSubstitute).toBe(false)
  })

  it('accepte un substitut et le signale', () => {
    const res = check('mojito', ['rhum-ambre', 'citron-vert', 'sirop-sucre', 'menthe', 'eau-gazeuse'])
    expect(res.status).toBe('faisable')
    expect(res.usesSubstitute).toBe(true)
    expect(res.lines.find((l) => l.line.ingredientId === 'rhum-blanc')?.substituteId).toBe('rhum-ambre')
  })

  it('classe en « presque » selon le seuil', () => {
    expect(check('daiquiri', ['rhum-blanc', 'sucre']).status).toBe('presque')
    expect(check('daiquiri', ['rhum-blanc']).status).toBe('autre')
    expect(check('daiquiri', ['rhum-blanc'], 2).status).toBe('presque')
  })

  it('ne compte pas deux fois un ingrédient présent sur deux lignes', () => {
    // Mojito : la menthe apparaît en feuilles et en brin décoratif
    const res = check('mojito', ['rhum-blanc', 'citron-vert', 'sucre', 'eau-gazeuse'])
    expect(res.missing).toEqual(['menthe'])
  })
})

describe('purchaseSuggestions', () => {
  it('classe les ingrédients par nombre de cocktails débloqués', () => {
    const owned = new Set(['gin', 'citron-jaune', 'sirop-sucre'])
    const checks = BASE_COCKTAILS.map((c) => checkCocktail(c, owned, byId, 1))
    const suggestions = purchaseSuggestions(checks)
    expect(suggestions.length).toBeGreaterThan(0)
    for (let i = 1; i < suggestions.length; i++) {
      expect(suggestions[i - 1].unlocks.length).toBeGreaterThanOrEqual(suggestions[i].unlocks.length)
    }
    const soda = suggestions.find((s) => s.ingredientId === 'eau-gazeuse')
    expect(soda?.unlocks.map((c) => c.id)).toEqual(expect.arrayContaining(['tom-collins', 'gin-fizz']))
  })
})

describe('containsFilter', () => {
  it('filtre par ingrédient ou par famille', () => {
    expect(containsFilter(cocktail('mai-tai'), 'rhum-agricole', byId)).toBe(true)
    expect(containsFilter(cocktail('manhattan'), 'f:whisky', byId)).toBe(true)
    expect(containsFilter(cocktail('negroni'), 'f:rhum', byId)).toBe(false)
  })
})

describe('formatage', () => {
  it('affiche les quantités à la française', () => {
    expect(formatQty(4.5)).toBe('4,5')
    expect(formatQty(0.5)).toBe('½')
    expect(formatQty(2.25)).toBe('2¼')
    expect(formatQty(6)).toBe('6')
    expect(formatAmount({ ingredientId: 'x', qty: 2, unit: 'trait' })).toBe('2 traits')
    expect(formatAmount({ ingredientId: 'x', qty: 1.5, unit: 'cl' })).toBe('1,5 cl')
    expect(formatAmount({ ingredientId: 'x', qty: 0.5, unit: 'piece' })).toBe('½')
    expect(formatAmount({ ingredientId: 'x', qty: 1, unit: 'piece' })).toBe('1')
    expect(formatAmount({ ingredientId: 'x', unit: 'top' })).toBe('Compléter')
    expect(formatAmount({ ingredientId: 'x', qty: 6, unit: 'top' })).toBe('6 cl')
  })

  it('raccourcit les noms à précision entre parenthèses', () => {
    expect(shortName('Liqueur de coco (Malibu…)')).toBe('Liqueur de coco')
    expect(shortName('Sirop de sucre (de canne)')).toBe('Sirop de sucre')
    expect(shortName('Rhum blanc')).toBe('Rhum blanc')
  })
})
