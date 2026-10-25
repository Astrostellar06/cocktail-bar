import { useEffect, useRef, useState } from 'react'
import { useConfirm } from '../components/Dialog'
import { BackIcon, DownloadIcon, TrashIcon, UploadIcon } from '../components/icons'
import { useToast } from '../components/Toast'
import { restoreRemoved, saveSetting } from '../lib/actions'
import { downloadBlob, exportData, importData, resetData } from '../lib/backup'
import { useGoBack } from '../lib/navigation'
import { useBar } from '../state/BarContext'

export function SettingsPage() {
  const { settings, bottles, cocktails, removedCount } = useBar()
  const custom = cocktails.filter((c) => c.custom).length
  const classics = cocktails.length - custom
  const edited = cocktails.filter((c) => c.edited).length
  const goBack = useGoBack('/')
  const toast = useToast()
  const confirm = useConfirm()
  const fileInput = useRef<HTMLInputElement>(null)
  const [persisted, setPersisted] = useState<boolean | null>(null)

  useEffect(() => {
    navigator.storage?.persisted?.().then(setPersisted)
  }, [])

  async function doExport() {
    const date = new Date().toISOString().slice(0, 10)
    downloadBlob(await exportData(), `mon-bar-${date}.json`)
  }

  async function doImport(file: File) {
    const ok = await confirm({
      title: 'Restaurer la sauvegarde ?',
      message: 'Toutes les données actuelles seront remplacées par celles du fichier.',
      confirmLabel: 'Restaurer',
      danger: true,
    })
    if (!ok) return
    try {
      await importData(file)
      toast('Sauvegarde restaurée !')
    } catch (err) {
      await confirm({ title: 'Import impossible', message: err instanceof Error ? err.message : undefined, alertOnly: true })
    }
  }

  async function doRestoreRemoved() {
    await restoreRemoved()
    toast(`${removedCount} recette${removedCount > 1 ? 's' : ''} restaurée${removedCount > 1 ? 's' : ''}`)
  }

  async function doReset() {
    const ok = await confirm({
      title: 'Tout effacer ?',
      message: 'Le bar, les recettes perso, les favoris et la liste de courses seront supprimés. Cette action est définitive.',
      confirmLabel: 'Tout effacer',
      danger: true,
    })
    if (!ok) return
    await resetData()
    window.location.reload()
  }

  return (
    <div className="page">
      <header className="page-header">
        <button className="btn icon ghost" onClick={goBack} aria-label="Retour">
          <BackIcon />
        </button>
        <h1 className="title small">Réglages</h1>
      </header>

      <section className="card stack">
        <h2 className="section-title">« Presque faisable »</h2>
        <p className="muted" style={{ margin: 0 }}>
          Nombre maximal d'ingrédients manquants pour qu'un cocktail soit classé « presque ».
        </p>
        <div className="segmented" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {[1, 2, 3].map((n) => (
            <button
              key={n}
              className={settings.almostThreshold === n ? 'active' : undefined}
              data-tone="presque"
              onClick={() => saveSetting('almostThreshold', n)}
            >
              <strong>{n}</strong>
              manquant{n > 1 ? 's' : ''}
            </button>
          ))}
        </div>
      </section>

      <section className="card stack">
        <h2 className="section-title">Sauvegarde</h2>
        <p className="muted" style={{ margin: 0 }}>
          Tes données sont stockées uniquement sur cet appareil. Exporte-les de temps en temps pour ne rien perdre
          (changement de téléphone, nettoyage du navigateur…).
        </p>
        <button className="btn teal block" onClick={doExport}>
          <DownloadIcon /> Exporter mes données
        </button>
        <button className="btn ghost block" onClick={() => fileInput.current?.click()}>
          <UploadIcon /> Importer une sauvegarde
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (file) doImport(file)
          }}
        />
        {persisted === false && (
          <p className="muted" style={{ margin: 0 }}>
            ⚠️ Le navigateur n'a pas encore garanti la conservation des données. Installer l'app sur l'écran d'accueil
            aide à la rendre permanente.
          </p>
        )}
      </section>

      <section className="card stack">
        <h2 className="section-title">Recettes classiques</h2>
        <p className="muted" style={{ margin: 0 }}>
          {edited} modifiée{edited > 1 ? 's' : ''} · {removedCount} supprimée{removedCount > 1 ? 's' : ''}. Une recette
          modifiée peut retrouver sa version d'origine depuis sa fiche.
        </p>
        {removedCount > 0 && (
          <button className="btn ghost block" onClick={doRestoreRemoved}>
            Restaurer les recettes supprimées
          </button>
        )}
      </section>

      <section className="card stack">
        <h2 className="section-title">À propos</h2>
        <p style={{ margin: 0 }}>
          {bottles.length} bouteille{bottles.length > 1 ? 's' : ''} · {classics} recettes classiques · {custom} recette
          {custom > 1 ? 's' : ''} perso
        </p>
        <button className="btn danger block" onClick={doReset}>
          <TrashIcon /> Tout effacer
        </button>
      </section>
    </div>
  )
}
