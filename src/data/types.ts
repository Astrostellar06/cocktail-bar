/** Rayons du bar : sert au classement et à savoir si l'on gère des bouteilles ou du garde-manger. */
export type GroupId =
  | 'spiritueux'
  | 'liqueurs'
  | 'aperitifs'
  | 'bitters'
  | 'softs'
  | 'jus'
  | 'sirops'
  | 'frais'
  | 'epicerie'

export interface Group {
  id: GroupId
  name: string
  /** « bouteille » : on ajoute des bouteilles (avec marque). « garde-manger » : simple case à cocher. */
  kind: 'bouteille' | 'garde-manger'
  color: string
  /** Degré proposé par défaut pour un ingrédient créé dans ce rayon (rayons alcoolisés seulement). */
  defaultAbv?: number
}

/** Type d'ingrédient demandé par les recettes (ex. « Rhum blanc »), indépendamment de la marque. */
export interface Ingredient {
  id: string
  name: string
  group: GroupId
  /** Famille, pour filtrer « tous les rhums », « tous les whiskies »… */
  family?: string
  /** Ingrédients acceptés à la place de celui-ci, par ordre de préférence. */
  substitutes?: string[]
  /** Degré d'alcool en % vol. (0 ou absent : sans alcool). */
  abv?: number
  /** Toujours disponible, sans avoir à l'ajouter au bar (ex. l'eau). */
  always?: boolean
  custom?: boolean
}

export type UnitId =
  | 'cl'
  | 'trait'
  | 'goutte'
  | 'cuillere'
  | 'cac'
  | 'piece'
  | 'feuille'
  | 'brin'
  | 'quartier'
  | 'tranche'
  | 'zeste'
  | 'morceau'
  | 'pincee'
  | 'top'
  | 'rincage'

export interface RecipeLine {
  ingredientId: string
  qty?: number
  unit?: UnitId
  /** Précision affichée après le nom (ex. « jus frais », « pour le givrage »). */
  note?: string
  /** Décoration ou ingrédient facultatif : ne compte pas dans « ce qu'il manque ». */
  optional?: boolean
}

export type GlassId =
  | 'coupe'
  | 'martini'
  | 'tumbler'
  | 'highball'
  | 'flute'
  | 'vin'
  | 'mug'
  | 'tiki'
  | 'hurricane'
  | 'shot'
  | 'irish'

export type MethodId = 'shaker' | 'melange' | 'construit' | 'blender'

export interface Cocktail {
  id: string
  name: string
  description?: string
  glass: GlassId
  method: MethodId
  /** Couleur approximative de la boisson, pour l'illustration. */
  color: string
  ingredients: RecipeLine[]
  steps: string[]
  /** Degré d'alcool saisi à la main ; sinon il est estimé à partir des ingrédients. */
  abv?: number
  /** Création de l'utilisateur. */
  custom?: boolean
  /** Recette classique modifiée par l'utilisateur. */
  edited?: boolean
  /** Recette de base dont cette création est une variante. */
  basedOn?: string
  updatedAt?: number
}
