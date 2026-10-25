import { useEffect, useRef, useState, type ReactNode } from 'react'
import { GROUPS, GROUP_BY_ID } from '../data/ingredients'
import { CUTOUT_DOWNLOAD_EVENT, cutoutBottle } from '../lib/cutout'
import { useBar } from '../state/BarContext'
import { BottleVisual } from './BottleVisual'
import { CameraIcon, CloseIcon, SwapIcon } from './icons'
import { IngredientList } from './IngredientList'
import { Sheet } from './Sheet'

const BOTTLE_GROUPS = GROUPS.filter((g) => g.kind === 'bouteille').map((g) => g.id)

export interface BottleFormValues {
  ingredientId: string
  label: string
  abv?: number
  image?: string
}

interface Props {
  initial: { ingredientId: string; label?: string; abv?: number; image?: string }
  submitLabel: string
  onSubmit: (values: BottleFormValues) => void | Promise<void>
  /** Champs supplémentaires affichés avant le bouton d'enregistrement. */
  extraFields?: ReactNode
  /** Détourage de la photo en cours ailleurs (bouteille scannée) : l'image arrivera par `initial.image`. */
  pendingImage?: boolean
}

/** Progression du premier téléchargement du modèle de détourage, ou `null` s'il n'y en a pas en cours. */
function useModelDownload(): number | null {
  const [progress, setProgress] = useState<number | null>(null)
  useEffect(() => {
    const onProgress = (e: Event) => {
      const value = (e as CustomEvent<number>).detail
      setProgress(value < 1 ? value : null)
    }
    window.addEventListener(CUTOUT_DOWNLOAD_EVENT, onProgress)
    return () => window.removeEventListener(CUTOUT_DOWNLOAD_EVENT, onProgress)
  }, [])
  return progress
}

/** Type, marque, degré et visuel d'une bouteille : utilisé à l'ajout (manuel ou scan) et à la modification. */
export function BottleForm({ initial, submitLabel, onSubmit, extraFields, pendingImage }: Props) {
  const { ingredientById } = useBar()
  const [ingredientId, setIngredientId] = useState(initial.ingredientId)
  const [label, setLabel] = useState(initial.label ?? '')
  const [abv, setAbv] = useState(initial.abv !== undefined ? String(initial.abv).replace('.', ',') : '')
  const [image, setImage] = useState(initial.image)
  const [imageTouched, setImageTouched] = useState(false)
  const download = useModelDownload()
  const [changingType, setChangingType] = useState(false)
  const [photoState, setPhotoState] = useState<'idle' | 'working' | 'failed'>('idle')
  const photoInput = useRef<HTMLInputElement>(null)

  const ingredient = ingredientById.get(ingredientId)
  const group = ingredient ? GROUP_BY_ID.get(ingredient.group) : undefined
  const alcoholic = group?.defaultAbv !== undefined
  const working = photoState === 'working' || (pendingImage && !imageTouched)

  // Photo détourée en arrière-plan : elle remplace l'icône, sauf si l'utilisateur a déjà choisi autre chose.
  useEffect(() => {
    if (!imageTouched && initial.image) setImage(initial.image)
  }, [initial.image, imageTouched])

  async function processPhoto(file: File) {
    setImageTouched(true)
    setPhotoState('working')
    const result = await cutoutBottle(file).catch(() => null)
    if (result) {
      setImage(result)
      setPhotoState('idle')
    } else {
      setPhotoState('failed')
    }
  }

  return (
    <form
      className="stack"
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        const degree = parseFloat(abv.replace(',', '.'))
        onSubmit({ ingredientId, label, abv: alcoholic && degree > 0 ? degree : undefined, image })
      }}
    >
      <div className="card row bottle-head">
        {group && <BottleVisual bottle={{ image }} group={group} size={72} />}
        <div className="grow">
          <strong>{ingredient?.name ?? 'Type inconnu'}</strong>
          <div className="muted">{group?.name}</div>
          <button type="button" className="btn sm ghost" style={{ marginTop: 6 }} onClick={() => setChangingType(true)}>
            <SwapIcon size={14} /> Changer de type
          </button>
        </div>
      </div>

      <label className="field">
        <span>Marque ou nom</span>
        <input className="input" placeholder="ex. Havana Club 3 ans" value={label} onChange={(e) => setLabel(e.target.value)} />
      </label>

      {alcoholic && (
        <label className="field">
          <span>Degré d'alcool (%)</span>
          <input
            className="input"
            inputMode="decimal"
            placeholder={`${String(ingredient?.abv ?? group?.defaultAbv).replace('.', ',')} (valeur habituelle)`}
            value={abv}
            onChange={(e) => setAbv(e.target.value)}
          />
        </label>
      )}

      <div className="field">
        <span>Visuel</span>
        <div className="row wrap">
          <button type="button" className="btn sm ghost" disabled={working} onClick={() => photoInput.current?.click()}>
            <CameraIcon size={16} /> {image ? 'Changer la photo' : 'Photographier la bouteille'}
          </button>
          {image && !working && (
            <button
              type="button"
              className="btn sm ghost"
              onClick={() => {
                setImageTouched(true)
                setImage(undefined)
              }}
            >
              <CloseIcon size={14} /> Retirer l'image
            </button>
          )}
        </div>
        {working && (
          <p className="row muted" style={{ margin: 0 }}>
            <span className="spinner small" aria-hidden="true" />
            {download !== null
              ? `Premier détourage : téléchargement du modèle (${Math.round(download * 100)} %)…`
              : 'Détourage de la photo… (quelques secondes)'}
          </p>
        )}
        {photoState === 'failed' && (
          <p className="error" style={{ fontWeight: 500 }}>
            Détourage impossible sur cette photo. Réessaie avec la bouteille de face, entière, avec un peu de marge autour.
          </p>
        )}
        <input
          ref={photoInput}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (file) processPhoto(file)
          }}
        />
      </div>

      {extraFields}

      <button className="btn pink block" type="submit" disabled={photoState === 'working'}>
        {photoState === 'working' ? 'Détourage en cours…' : submitLabel}
      </button>

      {changingType && (
        <Sheet title="Type de bouteille" onClose={() => setChangingType(false)}>
          <IngredientList
            groups={BOTTLE_GROUPS}
            allowCreate
            createLabel="Pas dans la liste ? Ajouter un autre type"
            onSelect={(id) => {
              setIngredientId(id)
              setChangingType(false)
            }}
          />
        </Sheet>
      )}
    </form>
  )
}
