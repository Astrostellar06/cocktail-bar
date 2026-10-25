import { describe, expect, it } from 'vitest'
import { BASE_INGREDIENTS } from '../data/ingredients'
import type { Ingredient } from '../data/types'
import { isValidGtin } from './barcode'
import { matchProduct, parseAbv, parseProduct, productLabel, type ProductInfo } from './openFoodFacts'

const product = (p: Partial<ProductInfo>): ProductInfo => ({ barcode: '0', name: '', categories: [], ...p })
const match = (p: Partial<ProductInfo>, ingredients: Ingredient[] = BASE_INGREDIENTS) =>
  matchProduct(product(p), ingredients).ingredientId

describe('matchProduct', () => {
  it('reconnaît les fiches réelles d’Open Food Facts', () => {
    expect(match({ brand: 'Havana Club', name: 'Añejo 7 Años', categories: ['en:hard-liquors', 'en:rums'] })).toBe('rhum-ambre')
    expect(match({ brand: 'Aperol, DCM S.p.A.', name: 'Aperol', categories: ['en:liqueurs'] })).toBe('aperol')
    expect(match({ brand: 'Martini', name: '', categories: ['en:wine-based-drinks', 'en:vermouth'] })).toBe('vermouth-rouge')
    expect(match({ brand: 'Noilly Prat', name: 'Noilly Prat', categories: ['en:vermouth'] })).toBe('vermouth-dry')
    expect(match({ name: 'London dry' })).toBe('gin')
    expect(match({ brand: 'Moët & Chandon', name: 'Bar Champagner', categories: ['en:sparkling-wines'] })).toBe('champagne')
  })

  it('déduit le style du rhum', () => {
    expect(match({ brand: 'Bacardi', name: 'Carta Blanca' })).toBe('rhum-blanc')
    expect(match({ brand: 'Captain Morgan', name: 'Original Spiced Gold' })).toBe('rhum-brun')
    expect(match({ brand: 'Trois Rivières', name: 'Rhum agricole blanc 50%' })).toBe('rhum-agricole')
    expect(match({ name: 'Rum', categories: ['en:white-rums'] })).toBe('rhum-blanc')
  })

  it('ne confond pas une liqueur avec le spiritueux qu’elle contient', () => {
    expect(match({ brand: 'Baileys', name: 'The Original Irish Cream' })).toBe('baileys')
    expect(match({ brand: 'Monin', name: 'Sirop de fraise' })).toBe('sirop-fraise')
    expect(match({ name: 'Islay single malt scotch whisky' })).toBe('scotch-tourbe')
  })

  it('privilégie les ingrédients créés par l’utilisateur', () => {
    const custom: Ingredient = { id: 'perso-pain-epices', name: "Sirop de pain d'épices", group: 'sirops', custom: true }
    expect(match({ brand: 'Monin', name: "Sirop de pain d'épices" }, [...BASE_INGREDIENTS, custom])).toBe('perso-pain-epices')
  })

  it('propose un rayon et un nom quand le type est inconnu', () => {
    const result = matchProduct(product({ brand: 'Monin', name: 'Monin Sirop Cookie 70cl', categories: ['en:syrups'] }), BASE_INGREDIENTS)
    expect(result.ingredientId).toBeUndefined()
    expect(result.group).toBe('sirops')
    expect(result.suggestedName).toBe('Sirop Cookie')
  })
})

describe('parseProduct', () => {
  it('lit le degré dans les nutriments ou dans le nom', () => {
    expect(parseProduct('1', { product_name: 'Aperol', nutriments: { alcohol_100g: 11 } }).abv).toBe(11)
    expect(parseProduct('1', { product_name: 'Rhum blanc 50% vol' }).abv).toBe(50)
    expect(parseAbv('Gin 37,5 %')).toBe(37.5)
    expect(parseAbv('70 cl')).toBeUndefined()
  })

  it('compose un libellé sans répéter la marque', () => {
    expect(productLabel(product({ brand: 'Havana Club', name: 'Añejo 7 Años' }))).toBe('Havana Club Añejo 7 Años')
    expect(productLabel(product({ brand: 'Aperol', name: 'Aperol' }))).toBe('Aperol')
  })
})

describe('isValidGtin', () => {
  it('vérifie la clé de contrôle', () => {
    expect(isValidGtin('8501110080439')).toBe(true)
    expect(isValidGtin('8002230000302')).toBe(true)
    expect(isValidGtin('8501110080438')).toBe(false)
    expect(isValidGtin('1234')).toBe(false)
  })
})
