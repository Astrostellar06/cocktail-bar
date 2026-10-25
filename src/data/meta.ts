import type { GlassId, MethodId, UnitId } from './types'

/** Libellés singulier / pluriel. Une chaîne vide = pas d'unité affichée (« 1 Œuf »). */
export const UNITS: Record<UnitId, { one: string; many: string }> = {
  cl: { one: 'cl', many: 'cl' },
  trait: { one: 'trait', many: 'traits' },
  goutte: { one: 'goutte', many: 'gouttes' },
  cuillere: { one: 'cuillère de bar', many: 'cuillères de bar' },
  cac: { one: 'càc', many: 'càc' },
  piece: { one: '', many: '' },
  feuille: { one: 'feuille', many: 'feuilles' },
  brin: { one: 'brin', many: 'brins' },
  quartier: { one: 'quartier', many: 'quartiers' },
  tranche: { one: 'tranche', many: 'tranches' },
  zeste: { one: 'zeste', many: 'zestes' },
  morceau: { one: 'morceau', many: 'morceaux' },
  pincee: { one: 'pincée', many: 'pincées' },
  top: { one: 'Compléter', many: 'Compléter' },
  rincage: { one: 'Rinçage', many: 'Rinçage' },
}

export const UNIT_OPTIONS: { id: UnitId; label: string }[] = [
  { id: 'cl', label: 'cl' },
  { id: 'trait', label: 'trait(s)' },
  { id: 'goutte', label: 'goutte(s)' },
  { id: 'cuillere', label: 'cuillère(s) de bar' },
  { id: 'cac', label: 'cuillère(s) à café' },
  { id: 'piece', label: 'pièce(s)' },
  { id: 'feuille', label: 'feuille(s)' },
  { id: 'brin', label: 'brin(s)' },
  { id: 'quartier', label: 'quartier(s)' },
  { id: 'tranche', label: 'tranche(s)' },
  { id: 'zeste', label: 'zeste(s)' },
  { id: 'morceau', label: 'morceau(x)' },
  { id: 'pincee', label: 'pincée(s)' },
  { id: 'top', label: 'compléter (top)' },
  { id: 'rincage', label: 'rinçage du verre' },
]

export const GLASSES: Record<GlassId, string> = {
  coupe: 'Coupe',
  martini: 'Verre à martini',
  tumbler: 'Tumbler',
  highball: 'Highball',
  flute: 'Flûte',
  vin: 'Verre à vin',
  mug: 'Mug en cuivre',
  tiki: 'Verre tiki',
  hurricane: 'Verre hurricane',
  shot: 'Verre à shot',
  irish: 'Verre à Irish coffee',
}

/** Libellés courts pour le choix du verre dans l'éditeur. */
export const GLASS_SHORT: Record<GlassId, string> = {
  coupe: 'Coupe',
  martini: 'Martini',
  tumbler: 'Tumbler',
  highball: 'Highball',
  flute: 'Flûte',
  vin: 'Vin',
  mug: 'Mug',
  tiki: 'Tiki',
  hurricane: 'Hurricane',
  shot: 'Shot',
  irish: 'Irish coffee',
}

export const METHODS: Record<MethodId, string> = {
  shaker: 'Au shaker',
  melange: 'Au verre à mélange',
  construit: 'Directement dans le verre',
  blender: 'Au blender',
}

/** Palette proposée pour la couleur des créations perso. */
export const DRINK_COLORS = [
  '#F3F0D0', '#FFD23F', '#F7A928', '#FF8A3D', '#E8434B', '#C0262E',
  '#FF4FA3', '#B03050', '#8B5CF6', '#3D7BFF', '#2EA8E8', '#19C3B1',
  '#9CCF5A', '#C8781E', '#7A4A22', '#3B2416',
]
