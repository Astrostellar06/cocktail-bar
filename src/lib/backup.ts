import { db } from './db'

const FORMAT = 'mon-bar'
const VERSION = 1

export async function exportData(): Promise<Blob> {
  const [bottles, pantry, ingredients, cocktails, removed, favorites, settings] = await Promise.all([
    db.bottles.toArray(),
    db.pantry.toArray(),
    db.ingredients.toArray(),
    db.cocktails.toArray(),
    db.removed.toArray(),
    db.favorites.toArray(),
    db.settings.toArray(),
  ])
  const payload = {
    format: FORMAT,
    version: VERSION,
    exportedAt: new Date().toISOString(),
    bottles,
    pantry,
    ingredients,
    cocktails,
    removed,
    favorites,
    settings,
  }
  return new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Remplace toutes les données par celles du fichier. Lève une erreur si le fichier n'est pas reconnu. */
export async function importData(file: File) {
  const data = JSON.parse(await file.text())
  if (data?.format !== FORMAT || !Array.isArray(data.bottles)) {
    throw new Error("Ce fichier n'est pas une sauvegarde de Mon Bar.")
  }
  const tables = [db.bottles, db.pantry, db.ingredients, db.cocktails, db.removed, db.favorites, db.settings]
  await db.transaction('rw', tables, async () => {
    await Promise.all(tables.map((t) => t.clear()))
    await db.bottles.bulkAdd(data.bottles)
    await db.pantry.bulkAdd(data.pantry ?? [])
    await db.ingredients.bulkAdd(data.ingredients ?? [])
    await db.cocktails.bulkAdd(data.cocktails ?? [])
    await db.removed.bulkAdd(data.removed ?? [])
    await db.favorites.bulkAdd(data.favorites ?? [])
    await db.settings.bulkAdd(data.settings ?? [])
  })
}

export async function resetData() {
  await db.delete()
  await db.open()
}
