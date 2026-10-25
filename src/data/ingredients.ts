import type { Group, GroupId, Ingredient } from './types'

export const GROUPS: Group[] = [
  { id: 'spiritueux', name: 'Spiritueux', kind: 'bouteille', color: '#FF8A3D', defaultAbv: 40 },
  { id: 'liqueurs', name: 'Liqueurs & crèmes', kind: 'bouteille', color: '#FF4FA3', defaultAbv: 25 },
  { id: 'aperitifs', name: 'Vins & apéritifs', kind: 'bouteille', color: '#E8434B', defaultAbv: 15 },
  { id: 'bitters', name: 'Bitters', kind: 'bouteille', color: '#8B5CF6', defaultAbv: 40 },
  { id: 'softs', name: 'Softs & sodas', kind: 'bouteille', color: '#3D7BFF' },
  { id: 'jus', name: 'Jus', kind: 'bouteille', color: '#FFC21A' },
  { id: 'sirops', name: 'Sirops', kind: 'bouteille', color: '#19C3B1' },
  { id: 'frais', name: 'Frais', kind: 'garde-manger', color: '#7CC84A' },
  { id: 'epicerie', name: 'Épicerie', kind: 'garde-manger', color: '#C9A27A' },
]

export const GROUP_BY_ID = new Map<GroupId, Group>(GROUPS.map((g) => [g.id, g]))

export const FAMILIES: Record<string, string> = {
  rhum: 'Tous les rhums',
  whisky: 'Tous les whiskies',
  agave: 'Tequila & mezcal',
  brandy: 'Cognac & eaux-de-vie',
  vermouth: 'Tous les vermouths',
  effervescent: 'Vins effervescents',
}

/** Cochés au premier lancement (modifiable dans le bar). */
export const DEFAULT_PANTRY = ['sucre']

const ing = (
  id: string,
  name: string,
  group: GroupId,
  extra: Pick<Ingredient, 'family' | 'substitutes' | 'abv' | 'always'> = {},
): Ingredient => ({ id, name, group, ...extra })

export const BASE_INGREDIENTS: Ingredient[] = [
  // Spiritueux
  ing('rhum-blanc', 'Rhum blanc', 'spiritueux', { abv: 40, family: 'rhum', substitutes: ['rhum-agricole', 'rhum-ambre'] }),
  ing('rhum-ambre', 'Rhum ambré', 'spiritueux', { abv: 40, family: 'rhum', substitutes: ['rhum-brun', 'rhum-blanc'] }),
  ing('rhum-brun', 'Rhum brun', 'spiritueux', { abv: 40, family: 'rhum', substitutes: ['rhum-ambre'] }),
  ing('rhum-agricole', 'Rhum agricole blanc', 'spiritueux', { abv: 50, family: 'rhum', substitutes: ['rhum-blanc'] }),
  ing('cachaca', 'Cachaça', 'spiritueux', { abv: 40, substitutes: ['rhum-agricole', 'rhum-blanc'] }),
  ing('gin', 'Gin', 'spiritueux', { abv: 40 }),
  ing('vodka', 'Vodka', 'spiritueux', { abv: 40 }),
  ing('tequila', 'Tequila', 'spiritueux', { abv: 38, family: 'agave' }),
  ing('mezcal', 'Mezcal', 'spiritueux', { abv: 45, family: 'agave' }),
  ing('bourbon', 'Bourbon', 'spiritueux', { abv: 45, family: 'whisky', substitutes: ['rye'] }),
  ing('rye', 'Rye whiskey', 'spiritueux', { abv: 45, family: 'whisky', substitutes: ['bourbon'] }),
  ing('scotch', 'Scotch whisky', 'spiritueux', { abv: 40, family: 'whisky' }),
  ing('scotch-tourbe', 'Whisky tourbé (Islay)', 'spiritueux', { abv: 46, family: 'whisky' }),
  ing('irish', 'Whiskey irlandais', 'spiritueux', { abv: 40, family: 'whisky' }),
  ing('cognac', 'Cognac', 'spiritueux', { abv: 40, family: 'brandy' }),
  ing('calvados', 'Calvados', 'spiritueux', { abv: 40, family: 'brandy' }),
  ing('pisco', 'Pisco', 'spiritueux', { abv: 40, family: 'brandy' }),
  ing('absinthe', 'Absinthe', 'spiritueux', { abv: 60, substitutes: ['pastis'] }),
  ing('pastis', 'Pastis', 'spiritueux', { abv: 45 }),

  // Liqueurs & crèmes
  ing('triple-sec', 'Triple sec (Cointreau…)', 'liqueurs', { abv: 40, substitutes: ['grand-marnier'] }),
  ing('grand-marnier', 'Grand Marnier / curaçao orange', 'liqueurs', { abv: 40, substitutes: ['triple-sec'] }),
  ing('curacao-bleu', 'Curaçao bleu', 'liqueurs', { abv: 25 }),
  ing('marasquin', 'Liqueur de marasquin', 'liqueurs', { abv: 32 }),
  ing('chartreuse-verte', 'Chartreuse verte', 'liqueurs', { abv: 55 }),
  ing('chartreuse-jaune', 'Chartreuse jaune', 'liqueurs', { abv: 40 }),
  ing('benedictine', 'Bénédictine', 'liqueurs', { abv: 40 }),
  ing('creme-cassis', 'Crème de cassis', 'liqueurs', { abv: 16 }),
  ing('creme-mure', 'Crème de mûre', 'liqueurs', { abv: 16, substitutes: ['creme-cassis'] }),
  ing('creme-cacao', 'Crème de cacao', 'liqueurs', { abv: 25 }),
  ing('creme-menthe', 'Crème de menthe', 'liqueurs', { abv: 24 }),
  ing('creme-violette', 'Crème de violette', 'liqueurs', { abv: 20 }),
  ing('liqueur-cafe', 'Liqueur de café (Kahlúa…)', 'liqueurs', { abv: 20 }),
  ing('amaretto', 'Amaretto', 'liqueurs', { abv: 28 }),
  ing('galliano', 'Galliano', 'liqueurs', { abv: 30 }),
  ing('liqueur-framboise', 'Liqueur de framboise (Chambord…)', 'liqueurs', { abv: 16.5 }),
  ing('liqueur-peche', 'Liqueur de pêche', 'liqueurs', { abv: 20 }),
  ing('liqueur-sureau', 'Liqueur de sureau (St-Germain…)', 'liqueurs', { abv: 20, substitutes: ['sirop-sureau'] }),
  ing('cherry-heering', 'Liqueur de cerise (Cherry Heering…)', 'liqueurs', { abv: 24 }),
  ing('liqueur-abricot', "Liqueur d'abricot", 'liqueurs', { abv: 25 }),
  ing('drambuie', 'Drambuie', 'liqueurs', { abv: 40 }),
  ing('baileys', 'Crème de whisky (Baileys…)', 'liqueurs', { abv: 17 }),
  ing('limoncello', 'Limoncello', 'liqueurs', { abv: 30 }),
  ing('liqueur-coco', 'Liqueur de coco (Malibu…)', 'liqueurs', { abv: 21 }),

  // Vins & apéritifs
  ing('vermouth-rouge', 'Vermouth rouge', 'aperitifs', { abv: 16, family: 'vermouth' }),
  ing('vermouth-dry', 'Vermouth dry', 'aperitifs', { abv: 18, family: 'vermouth' }),
  ing('lillet', 'Lillet blanc', 'aperitifs', { abv: 17 }),
  ing('campari', 'Campari', 'aperitifs', { abv: 25 }),
  ing('aperol', 'Apérol', 'aperitifs', { abv: 11 }),
  ing('fernet', 'Fernet-Branca', 'aperitifs', { abv: 39 }),
  ing('amaro', 'Amaro (Nonino, Montenegro…)', 'aperitifs', { abv: 30 }),
  ing('champagne', 'Champagne / crémant', 'aperitifs', { abv: 12, family: 'effervescent', substitutes: ['prosecco'] }),
  ing('prosecco', 'Prosecco', 'aperitifs', { abv: 11, family: 'effervescent', substitutes: ['champagne'] }),
  ing('vin-blanc', 'Vin blanc sec', 'aperitifs', { abv: 12 }),
  ing('vin-rouge', 'Vin rouge', 'aperitifs', { abv: 13 }),
  ing('porto', 'Porto rouge', 'aperitifs', { abv: 19 }),

  // Bitters
  ing('angostura', 'Angostura bitters', 'bitters', { abv: 44.7 }),
  ing('peychaud', "Peychaud's bitters", 'bitters', { abv: 35, substitutes: ['angostura'] }),
  ing('orange-bitters', 'Orange bitters', 'bitters', { abv: 28 }),

  // Softs & sodas
  ing('tonic', 'Tonic', 'softs'),
  ing('eau-gazeuse', 'Eau gazeuse', 'softs'),
  ing('cola', 'Cola', 'softs'),
  ing('ginger-beer', 'Ginger beer', 'softs', { substitutes: ['ginger-ale'] }),
  ing('ginger-ale', 'Ginger ale', 'softs', { substitutes: ['ginger-beer'] }),
  ing('limonade', 'Limonade', 'softs'),
  ing('soda-pamplemousse', 'Soda au pamplemousse', 'softs'),

  // Jus
  ing('jus-orange', "Jus d'orange", 'jus'),
  ing('jus-ananas', "Jus d'ananas", 'jus'),
  ing('jus-cranberry', 'Jus de cranberry', 'jus'),
  ing('jus-pamplemousse', 'Jus de pamplemousse', 'jus'),
  ing('jus-pomme', 'Jus de pomme', 'jus'),
  ing('jus-tomate', 'Jus de tomate', 'jus'),
  ing('nectar-peche', 'Nectar de pêche', 'jus'),

  // Sirops
  ing('sirop-sucre', 'Sirop de sucre (de canne)', 'sirops', { substitutes: ['sucre'] }),
  ing('grenadine', 'Sirop de grenadine', 'sirops'),
  ing('orgeat', "Sirop d'orgeat", 'sirops'),
  ing('sirop-miel', 'Sirop de miel', 'sirops', { substitutes: ['miel'] }),
  ing('sirop-agave', "Sirop d'agave", 'sirops', { substitutes: ['sirop-sucre'] }),
  ing('sirop-framboise', 'Sirop de framboise', 'sirops'),
  ing('sirop-fraise', 'Sirop de fraise', 'sirops', { substitutes: ['sirop-framboise'] }),
  ing('sirop-menthe', 'Sirop de menthe', 'sirops'),
  ing('sirop-sureau', 'Sirop de sureau', 'sirops', { substitutes: ['liqueur-sureau'] }),
  ing('sirop-vanille', 'Sirop de vanille', 'sirops'),
  ing('sirop-caramel', 'Sirop de caramel', 'sirops'),
  ing('falernum', 'Falernum', 'sirops'),

  // Frais
  ing('citron-vert', 'Citron vert', 'frais'),
  ing('citron-jaune', 'Citron jaune', 'frais'),
  ing('orange', 'Orange', 'frais'),
  ing('menthe', 'Menthe fraîche', 'frais'),
  ing('basilic', 'Basilic frais', 'frais'),
  ing('oeuf', 'Œuf', 'frais'),
  ing('creme', 'Crème liquide', 'frais'),
  ing('lait', 'Lait', 'frais'),
  ing('gingembre', 'Gingembre frais', 'frais'),
  ing('concombre', 'Concombre', 'frais'),
  ing('mures', 'Mûres', 'frais'),
  ing('celeri', 'Céleri', 'frais'),
  ing('ananas', 'Ananas frais', 'frais'),

  // Épicerie
  ing('eau', 'Eau plate', 'epicerie', { always: true }),
  ing('sucre', 'Sucre', 'epicerie', { substitutes: ['sirop-sucre'] }),
  ing('miel', 'Miel', 'epicerie', { substitutes: ['sirop-miel'] }),
  ing('sel', 'Sel', 'epicerie'),
  ing('poivre', 'Poivre', 'epicerie'),
  ing('worcestershire', 'Sauce Worcestershire', 'epicerie'),
  ing('tabasco', 'Tabasco', 'epicerie'),
  ing('cafe', 'Café expresso', 'epicerie'),
  ing('the', 'Thé noir', 'epicerie'),
  ing('creme-coco', 'Crème de coco', 'epicerie'),
  ing('fleur-oranger', "Eau de fleur d'oranger", 'epicerie'),
  ing('cerise', 'Cerise à cocktail', 'epicerie'),
  ing('olive', 'Olive verte', 'epicerie'),
  ing('muscade', 'Noix de muscade', 'epicerie'),
]
