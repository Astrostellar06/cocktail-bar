import type { GroupId, Ingredient } from '../data/types'
import { normalize, shortName } from './text'

/** Fiche produit simplifiée, tirée d'Open Food Facts. */
export interface ProductInfo {
  barcode: string
  name: string
  brand?: string
  abv?: number
  imageUrl?: string
  categories: string[]
}

const FIELDS = 'product_name,product_name_fr,generic_name_fr,brands,categories_tags,nutriments,image_front_url'

/** Cherche un produit par code-barres. `null` : produit inconnu. Lève une erreur si le service est injoignable. */
export async function lookupProduct(barcode: string): Promise<ProductInfo | null> {
  const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=${FIELDS}`, {
    signal: AbortSignal.timeout(12000),
  })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Open Food Facts a répondu ${res.status}`)
  const json = await res.json()
  if (json.status !== 1 || !json.product) return null
  return parseProduct(barcode, json.product)
}

interface RawProduct {
  product_name?: string
  product_name_fr?: string
  generic_name_fr?: string
  brands?: string
  categories_tags?: string[]
  nutriments?: Record<string, number | string | undefined>
  image_front_url?: string
}

export function parseProduct(barcode: string, p: RawProduct): ProductInfo {
  const brand = p.brands?.split(',')[0]?.trim() || undefined
  const name = (p.product_name_fr || p.product_name || p.generic_name_fr || '').trim()
  const rawAbv = p.nutriments?.alcohol_100g ?? p.nutriments?.alcohol ?? p.nutriments?.alcohol_value
  const abv = Number(rawAbv) > 0 ? Number(rawAbv) : parseAbv(`${name} ${p.generic_name_fr ?? ''}`)
  return { barcode, name, brand, abv, imageUrl: p.image_front_url, categories: p.categories_tags ?? [] }
}

/** « 40% vol », « 37,5 % », « 45° » → nombre. */
export function parseAbv(text: string): number | undefined {
  const m = text.match(/(\d{1,2}(?:[.,]\d{1,2})?)\s?(?:%|°)/)
  const value = m ? parseFloat(m[1].replace(',', '.')) : NaN
  return value > 0 && value < 90 ? value : undefined
}

/** Nom affiché de la bouteille : « Havana Club Añejo 7 Años ». */
export function productLabel({ name, brand }: ProductInfo): string {
  if (!brand) return name
  if (!name) return brand
  return normalize(name).includes(normalize(brand)) ? name : `${brand} ${name}`
}

// ─── Reconnaissance du type ─────────────────────────────

/** Marqueur « c'est un rhum » : le style (blanc, ambré…) se déduit du nom. */
const RUM = '__rhum'

/** Mots-clés (marques, appellations) → ingrédient. Les règles les plus précises d'abord. « rhum » se précise ensuite. */
const KEYWORDS: [RegExp, string][] = [
  // Liqueurs et apéritifs de marque (avant les spiritueux : « crème de whisky » n'est pas un whisky)
  [/cointreau|triple sec|combier/, 'triple-sec'],
  [/grand marnier|dry curacao|curacao (orange|triple)/, 'grand-marnier'],
  [/curacao bleu|blue curacao/, 'curacao-bleu'],
  [/baileys|cream liqueur|creme de whisky|irish cream/, 'baileys'],
  [/kahlua|tia maria|liqueur de cafe|coffee liqueur/, 'liqueur-cafe'],
  [/amaretto|disaronno/, 'amaretto'],
  [/limoncello/, 'limoncello'],
  [/malibu|liqueur de coco|coconut liqueur/, 'liqueur-coco'],
  [/st[- ]?germain|liqueur de (fleur de )?sureau|elderflower liqueur/, 'liqueur-sureau'],
  [/chambord|liqueur de framboise|creme de framboise/, 'liqueur-framboise'],
  [/marasquin|maraschino|luxardo/, 'marasquin'],
  [/heering|liqueur de cerise|cherry liqueur/, 'cherry-heering'],
  [/creme de cassis|liqueur de cassis/, 'creme-cassis'],
  [/creme de mure|liqueur de mure/, 'creme-mure'],
  [/creme de cacao/, 'creme-cacao'],
  [/creme de menthe|get ?27|get ?31|pippermint/, 'creme-menthe'],
  [/creme de violette|liqueur de violette/, 'creme-violette'],
  [/creme de peche|liqueur de peche|peach schnapps/, 'liqueur-peche'],
  [/liqueur d.abricot|apricot brandy/, 'liqueur-abricot'],
  [/chartreuse.*(jaune|yellow)/, 'chartreuse-jaune'],
  [/chartreuse/, 'chartreuse-verte'],
  [/benedictine/, 'benedictine'],
  [/drambuie/, 'drambuie'],
  [/galliano/, 'galliano'],
  [/campari/, 'campari'],
  [/aperol/, 'aperol'],
  [/lillet/, 'lillet'],
  [/fernet/, 'fernet'],
  [/\bamaro\b|montenegro|nonino|averna|ramazzotti|cynar/, 'amaro'],
  [/orange bitters?|bitter orange/, 'orange-bitters'],
  [/angostura/, 'angostura'],
  [/peychaud/, 'peychaud'],
  [/noilly|vermouth.*(dry|sec)|extra dry/, 'vermouth-dry'],
  [/vermouth|martini (rosso|bianco|rosato|riserva)|cinzano|carpano|antica formula|punt e mes/, 'vermouth-rouge'],
  [/prosecco/, 'prosecco'],
  [/champagne|cremant|\bcava\b/, 'champagne'],
  [/\bporto\b|\bport\b/, 'porto'],
  // Spiritueux
  [/absinthe/, 'absinthe'],
  [/pastis|ricard|pernod|\bouzo\b/, 'pastis'],
  [/mezcal/, 'mezcal'],
  [/tequila/, 'tequila'],
  [/cachaca/, 'cachaca'],
  [/pisco/, 'pisco'],
  [/calvados|pays d.auge/, 'calvados'],
  [/cognac|armagnac|brandy/, 'cognac'],
  [/\b(rhum|rum|ron)\b|havana club|bacardi|captain morgan|diplomatico|don papa|kraken|plantation|trois rivieres|damoiseau|saint james|clement/, RUM],
  [/\bgin\b|london dry|tanqueray|bombay|hendrick|beefeater|gordon|citadelle|monkey 47|gin mare|botanist/, 'gin'],
  [/vodka|absolut|smirnoff|grey goose|belvedere|zubrowka|eristoff|ketel one/, 'vodka'],
  [/bourbon|jim beam|maker.s mark|wild turkey|four roses|woodford|buffalo trace|bulleit/, 'bourbon'],
  [/\brye\b/, 'rye'],
  [/islay|laphroaig|ardbeg|lagavulin|caol ila|bowmore|tourbe|peated|smoky/, 'scotch-tourbe'],
  [/irish|jameson|bushmills|tullamore|redbreast|teeling|powers/, 'irish'],
  [/whisk|scotch|single malt|blended malt|glen|chivas|johnnie walker|ballantine|grant.s|label 5|clan campbell|nikka|talisker|aberlour|monkey shoulder/, 'scotch'],
  // Sirops (avant les jus : « sirop de fraise » n'est pas un jus)
  [/orgeat/, 'orgeat'],
  [/grenadine/, 'grenadine'],
  [/sirop de (sucre|canne)|sucre de canne liquide|cane sugar syrup|simple syrup/, 'sirop-sucre'],
  [/sirop d.agave|agave syrup|nectar d.agave/, 'sirop-agave'],
  [/sirop de menthe|menthe glaciale|mint syrup/, 'sirop-menthe'],
  [/sirop de fraise|strawberry syrup/, 'sirop-fraise'],
  [/sirop de framboise|raspberry syrup/, 'sirop-framboise'],
  [/sirop de vanille|vanilla syrup/, 'sirop-vanille'],
  [/sirop de caramel|caramel syrup/, 'sirop-caramel'],
  [/sirop de (fleur de )?sureau|elderflower (syrup|cordial)/, 'sirop-sureau'],
  [/sirop de miel|honey syrup/, 'sirop-miel'],
  [/falernum/, 'falernum'],
  // Softs
  [/tonic/, 'tonic'],
  [/ginger beer/, 'ginger-beer'],
  [/ginger ale|canada dry/, 'ginger-ale'],
  [/\bcola\b|coca|pepsi/, 'cola'],
  [/pamplemousse.*(soda|petillant)|grapefruit soda|\bting\b/, 'soda-pamplemousse'],
  [/limonade|lemonade|sprite|7 ?up/, 'limonade'],
  [/eau gazeuse|eau petillante|perrier|badoit|san pellegrino|club soda|soda water/, 'eau-gazeuse'],
  // Jus
  [/jus d.orange|orange juice/, 'jus-orange'],
  [/jus d.ananas|pineapple juice/, 'jus-ananas'],
  [/cranberry|canneberge/, 'jus-cranberry'],
  [/jus de pamplemousse|grapefruit juice/, 'jus-pamplemousse'],
  [/jus de pomme|apple juice/, 'jus-pomme'],
  [/jus de tomate|tomato juice/, 'jus-tomate'],
  [/nectar de peche|peach nectar/, 'nectar-peche'],
  [/vin blanc|white wine/, 'vin-blanc'],
  [/vin rouge|red wine/, 'vin-rouge'],
]

/** Catégories Open Food Facts (« en:white-rums »…) → ingrédient. Les plus précises d'abord. */
const CATEGORIES: [string, string][] = [
  ['white-rums', 'rhum-blanc'],
  ['agricultural-rums', 'rhum-agricole'],
  ['rhums-agricoles', 'rhum-agricole'],
  ['dark-rums', 'rhum-brun'],
  ['spiced-rums', 'rhum-brun'],
  ['amber-rums', 'rhum-ambre'],
  ['golden-rums', 'rhum-ambre'],
  ['rums', RUM],
  ['gins', 'gin'],
  ['vodkas', 'vodka'],
  ['mezcals', 'mezcal'],
  ['tequilas', 'tequila'],
  ['bourbons', 'bourbon'],
  ['rye-whiskies', 'rye'],
  ['irish-whiskeys', 'irish'],
  ['scotch', 'scotch'],
  ['whiskies', 'scotch'],
  ['whiskeys', 'scotch'],
  ['cognacs', 'cognac'],
  ['armagnacs', 'cognac'],
  ['brandies', 'cognac'],
  ['calvados', 'calvados'],
  ['piscos', 'pisco'],
  ['cachacas', 'cachaca'],
  ['absinthes', 'absinthe'],
  ['pastis', 'pastis'],
  ['anise', 'pastis'],
  ['coffee-liqueurs', 'liqueur-cafe'],
  ['cream-liqueurs', 'baileys'],
  ['orange-liqueurs', 'triple-sec'],
  ['triple-sec', 'triple-sec'],
  ['blackcurrant-liqueurs', 'creme-cassis'],
  ['cremes-de-cassis', 'creme-cassis'],
  ['limoncello', 'limoncello'],
  ['amaretto', 'amaretto'],
  ['vermouth', 'vermouth-rouge'],
  ['champagnes', 'champagne'],
  ['proseccos', 'prosecco'],
  ['sparkling-wines', 'champagne'],
  ['port-wines', 'porto'],
  ['red-wines', 'vin-rouge'],
  ['white-wines', 'vin-blanc'],
  ['tonic', 'tonic'],
  ['ginger-beers', 'ginger-beer'],
  ['ginger-ales', 'ginger-ale'],
  ['colas', 'cola'],
  ['lemonades', 'limonade'],
  ['sparkling-waters', 'eau-gazeuse'],
  ['carbonated-waters', 'eau-gazeuse'],
  ['orange-juices', 'jus-orange'],
  ['pineapple-juices', 'jus-ananas'],
  ['cranberry-juices', 'jus-cranberry'],
  ['grapefruit-juices', 'jus-pamplemousse'],
  ['apple-juices', 'jus-pomme'],
  ['tomato-juices', 'jus-tomate'],
  ['peach-nectars', 'nectar-peche'],
  ['grenadine', 'grenadine'],
  ['orgeat', 'orgeat'],
  ['cane-sugar-syrups', 'sirop-sucre'],
  ['mint-syrups', 'sirop-menthe'],
  ['strawberry-syrups', 'sirop-fraise'],
  ['raspberry-syrups', 'sirop-framboise'],
  ['vanilla-syrups', 'sirop-vanille'],
  ['caramel-syrups', 'sirop-caramel'],
]

/** Rayon probable quand le type exact est inconnu. */
const GROUP_CATEGORIES: [string, GroupId][] = [
  ['bitters', 'bitters'],
  ['liqueurs', 'liqueurs'],
  ['syrups', 'sirops'],
  ['juices', 'jus'],
  ['nectars', 'jus'],
  ['wines', 'aperitifs'],
  ['aperitif', 'aperitifs'],
  ['spirits', 'spiritueux'],
  ['hard-liquors', 'spiritueux'],
  ['eaux-de-vie', 'spiritueux'],
  ['sodas', 'softs'],
  ['carbonated-drinks', 'softs'],
  ['soft-drinks', 'softs'],
]

function rumStyle(text: string): string {
  if (/agricole/.test(text)) return 'rhum-agricole'
  if (/\b(blanc|blanca|blanco|white|silver|cristal|3 (anos|ans|years))\b|carta blanca/.test(text)) return 'rhum-blanc'
  if (/\b(brun|dark|black|negro|spiced|epice)\b|kraken/.test(text)) return 'rhum-brun'
  return 'rhum-ambre'
}

export interface ProductMatch {
  /** Ingrédient reconnu ; absent si le type n'a pas pu être déterminé. */
  ingredientId?: string
  /** Rayon probable, pour créer un nouvel ingrédient. */
  group?: GroupId
  /** Nom proposé pour un nouvel ingrédient (« Sirop de pain d'épices »). */
  suggestedName: string
}

export function matchProduct(product: ProductInfo, ingredients: Ingredient[]): ProductMatch {
  const text = normalize(`${product.brand ?? ''} ${product.name}`)
  const tags = product.categories.map((t) => t.replace(/^[a-z]{2}:/, ''))
  const hasTag = (key: string) => tags.some((t) => t === key || t.endsWith(key))
  // Un rhum : la catégorie précise (« white-rums ») prime, sinon le style se lit dans le nom.
  const rumCategory = CATEGORIES.find(([key, id]) => id.startsWith('rhum-') && hasTag(key))?.[1]
  const resolve = (id: string) => (id === RUM ? (rumCategory ?? rumStyle(text)) : id)
  const suggestedName = genericName(product)

  // 1. Ingrédients créés par l'utilisateur, puis noms d'ingrédients cités tels quels (le plus long l'emporte).
  const named = ingredients
    .filter((i) => {
      const n = normalize(shortName(i.name))
      return n.length >= 4 && new RegExp(`\\b${escapeRegExp(n)}\\b`).test(text)
    })
    .sort((a, b) => Number(!!b.custom) - Number(!!a.custom) || shortName(b.name).length - shortName(a.name).length)
  const custom = named.find((i) => i.custom)
  if (custom) return { ingredientId: custom.id, suggestedName }

  // 2. Marques et appellations.
  const keyword = KEYWORDS.find(([re]) => re.test(text))
  if (keyword) return { ingredientId: resolve(keyword[1]), suggestedName }

  // 3. Catégories.
  const category = CATEGORIES.find(([key]) => hasTag(key))
  if (category) return { ingredientId: resolve(category[1]), suggestedName }

  if (named[0]) return { ingredientId: named[0].id, suggestedName }

  // 4. Type inconnu : on devine au moins le rayon.
  const group =
    GROUP_CATEGORIES.find(([key]) => tags.some((t) => t.includes(key)))?.[1] ??
    (product.abv ? 'spiritueux' : undefined)
  return { group, suggestedName }
}

/** Nom générique d'un produit, sans la marque : « Monin Sirop de pain d'épices » → « Sirop de pain d'épices ». */
function genericName({ name, brand }: ProductInfo): string {
  let result = name
  if (brand) result = result.replace(new RegExp(escapeRegExp(brand), 'i'), '')
  result = result.replace(/\d+([.,]\d+)?\s?(cl|ml|l|%|°)\b.*$/i, '').replace(/\s+/g, ' ').trim()
  return result ? result[0].toUpperCase() + result.slice(1) : name
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
