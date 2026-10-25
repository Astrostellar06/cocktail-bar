import { describe, expect, it } from 'vitest'
import { BASE_COCKTAILS } from '../data/cocktails'
import { BASE_INGREDIENTS } from '../data/ingredients'
import { estimateAbv, formatAbv } from './abv'

const byId = new Map(BASE_INGREDIENTS.map((i) => [i.id, i]))
const abvOf = (id: string) => estimateAbv(BASE_COCKTAILS.find((c) => c.id === id)!, byId)

describe('estimateAbv', () => {
  it('donne des degrés réalistes pour les classiques', () => {
    expect(abvOf('daiquiri').abv).toBeGreaterThan(13)
    expect(abvOf('daiquiri').abv).toBeLessThan(17)
    expect(abvOf('manhattan').abv).toBeGreaterThan(22)
    expect(abvOf('manhattan').abv).toBeLessThan(29)
    expect(abvOf('spritz').abv).toBeGreaterThan(6)
    expect(abvOf('spritz').abv).toBeLessThan(11)
    expect(abvOf('mauresque').abv).toBeGreaterThan(4)
    expect(abvOf('mauresque').abv).toBeLessThan(8)
  })

  it('reconnaît les cocktails sans alcool', () => {
    expect(abvOf('virgin-mojito')).toEqual({ abv: 0, alcoholFree: true })
    expect(abvOf('mojito').alcoholFree).toBe(false)
    const alcoholFree = BASE_COCKTAILS.filter((c) => estimateAbv(c, byId).alcoholFree)
    expect(alcoholFree.length).toBeGreaterThanOrEqual(20)
  })

  it('respecte un degré saisi à la main', () => {
    const daiquiri = BASE_COCKTAILS.find((c) => c.id === 'daiquiri')!
    expect(estimateAbv({ ...daiquiri, abv: 18 }, byId)).toEqual({ abv: 18, alcoholFree: false })
    expect(estimateAbv({ ...daiquiri, abv: 0 }, byId).alcoholFree).toBe(true)
  })

  it('donne un degré à chaque cocktail alcoolisé', () => {
    for (const c of BASE_COCKTAILS) {
      const { abv, alcoholFree } = estimateAbv(c, byId)
      if (!alcoholFree) expect(abv, c.name).toBeGreaterThan(3)
      expect(abv, c.name).toBeLessThan(45)
    }
  })
})

describe('formatAbv', () => {
  it('affiche un degré arrondi', () => {
    expect(formatAbv({ abv: 14.6, alcoholFree: false })).toBe('≈ 15 %')
    expect(formatAbv({ abv: 0, alcoholFree: true })).toBe('Sans alcool')
  })
})
