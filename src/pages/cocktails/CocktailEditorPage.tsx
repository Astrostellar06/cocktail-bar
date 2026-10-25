import { useState, type FormEvent } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { BackIcon, GlassIcon, PlusIcon, TrashIcon } from '../../components/icons'
import { IngredientList } from '../../components/IngredientList'
import { Sheet } from '../../components/Sheet'
import { useToast } from '../../components/Toast'
import { DRINK_COLORS, GLASS_SHORT, GLASSES, METHODS, UNIT_OPTIONS } from '../../data/meta'
import type { Cocktail, GlassId, MethodId, RecipeLine, UnitId } from '../../data/types'
import { estimateAbv, formatAbv } from '../../lib/abv'
import { saveCocktail } from '../../lib/actions'
import { useGoBack } from '../../lib/navigation'
import { makeId } from '../../lib/text'
import { useBar, useIngredientName } from '../../state/BarContext'

/** Ligne en cours d'édition : la quantité reste du texte pour accepter « 4,5 ». */
interface DraftLine {
  key: string
  ingredientId: string
  qty: string
  unit: UnitId | ''
  note: string
  optional: boolean
}

const toDraft = (l: RecipeLine): DraftLine => ({
  key: makeId('l'),
  ingredientId: l.ingredientId,
  qty: l.qty !== undefined ? String(l.qty).replace('.', ',') : '',
  unit: l.unit ?? '',
  note: l.note ?? '',
  optional: !!l.optional,
})

const emptyLine = (): DraftLine => ({ key: makeId('l'), ingredientId: '', qty: '', unit: 'cl', note: '', optional: false })

const fromDraft = (d: DraftLine): RecipeLine => {
  const qty = parseFloat(d.qty.replace(',', '.'))
  return {
    ingredientId: d.ingredientId,
    ...(Number.isFinite(qty) && qty > 0 && { qty }),
    ...(d.unit && { unit: d.unit }),
    ...(d.note.trim() && { note: d.note.trim() }),
    ...(d.optional && { optional: true }),
  }
}

/** Création (/cocktails/nouveau, éventuellement ?depuis=<id>) ou modification (/cocktails/:id/modifier). */
export function CocktailEditorPage() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const { cocktailById } = useBar()
  const existing = id ? cocktailById.get(id) : undefined
  const source = existing ?? cocktailById.get(params.get('depuis') ?? '')

  if (id && !existing) {
    return (
      <div className="page no-tabbar">
        <div className="card empty">
          <p>Cette recette n'existe pas (ou plus).</p>
        </div>
      </div>
    )
  }
  return <Editor key={id ?? source?.id ?? 'new'} existing={existing} source={source} />
}

function Editor({ existing, source }: { existing?: Cocktail; source?: Cocktail }) {
  const navigate = useNavigate()
  const goBack = useGoBack('/cocktails')
  const toast = useToast()
  const ingredientName = useIngredientName()
  const { ingredientById } = useBar()

  const [name, setName] = useState(existing?.name ?? (source ? `${source.name} (ma version)` : ''))
  const [description, setDescription] = useState(source?.description ?? '')
  const [glass, setGlass] = useState<GlassId>(source?.glass ?? 'tumbler')
  const [method, setMethod] = useState<MethodId>(source?.method ?? 'shaker')
  const [color, setColor] = useState(source?.color ?? DRINK_COLORS[3])
  const [lines, setLines] = useState<DraftLine[]>(source ? source.ingredients.map(toDraft) : [emptyLine()])
  const [steps, setSteps] = useState(source?.steps.join('\n') ?? '')
  const [abv, setAbv] = useState(source?.abv !== undefined ? String(source.abv).replace('.', ',') : '')
  const [picking, setPicking] = useState<string | null>(null)
  const [error, setError] = useState('')

  const updateLine = (key: string, changes: Partial<DraftLine>) =>
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...changes } : l)))

  const manualAbv = parseFloat(abv.replace(',', '.'))
  const estimate = estimateAbv(
    { ingredients: lines.filter((l) => l.ingredientId).map(fromDraft), method, glass },
    ingredientById,
  )

  async function submit(e: FormEvent) {
    e.preventDefault()
    const ingredients = lines.filter((l) => l.ingredientId).map(fromDraft)
    if (!name.trim()) return setError('Donne un nom à ton cocktail.')
    if (ingredients.length === 0) return setError('Ajoute au moins un ingrédient.')
    if (ingredients.every((l) => l.optional)) return setError('Au moins un ingrédient doit être obligatoire.')

    const cocktail: Cocktail = {
      id: existing?.id ?? makeId('perso'),
      name: name.trim(),
      description: description.trim() || undefined,
      glass,
      method,
      color,
      ingredients,
      steps: steps.split('\n').map((s) => s.trim()).filter(Boolean),
      ...(Number.isFinite(manualAbv) && manualAbv >= 0 && { abv: manualAbv }),
      // Une variante garde le lien vers le classique dont elle part ; une modification garde le sien.
      basedOn: existing ? existing.basedOn : source && !source.custom ? source.id : undefined,
    }
    await saveCocktail(cocktail)
    toast(existing ? 'Recette mise à jour' : 'Recette créée !')
    navigate(`/cocktails/${cocktail.id}`, { replace: true })
  }

  return (
    <form className="page no-tabbar" onSubmit={submit}>
      <header className="page-header">
        <button type="button" className="btn icon ghost" onClick={goBack} aria-label="Annuler">
          <BackIcon />
        </button>
        <h1 className="title small">{existing ? 'Modifier' : 'Ma recette'}</h1>
      </header>

      <section className="card stack">
        <div className="row" style={{ justifyContent: 'center' }}>
          <GlassIcon glass={glass} color={color} size={96} />
        </div>
        <label className="field">
          <span>Nom</span>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="ex. Spritz du dimanche" />
        </label>
        <label className="field">
          <span>Description (facultatif)</span>
          <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
      </section>

      <section className="card stack">
        <h2 className="section-title">Verre & couleur</h2>
        <div className="glass-choices">
          {(Object.keys(GLASSES) as GlassId[]).map((g) => (
            <button key={g} type="button" className={glass === g ? 'on' : undefined} onClick={() => setGlass(g)}>
              <GlassIcon glass={g} color={color} size={36} />
              {GLASS_SHORT[g]}
            </button>
          ))}
        </div>
        <div className="swatches">
          {DRINK_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={color === c ? 'on' : undefined}
              style={{ background: c }}
              onClick={() => setColor(c)}
              aria-label={`Couleur ${c}`}
            />
          ))}
        </div>
        <label className="field">
          <span>Méthode</span>
          <select className="select" value={method} onChange={(e) => setMethod(e.target.value as MethodId)}>
            {(Object.keys(METHODS) as MethodId[]).map((m) => (
              <option key={m} value={m}>
                {METHODS[m]}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="card stack">
        <h2 className="section-title">Ingrédients</h2>
        {lines.map((l) => (
          <div key={l.key} className="line-editor">
            <div className="row">
              <button
                type="button"
                className={`ingredient-button${l.ingredientId ? '' : ' empty-choice'}`}
                onClick={() => setPicking(l.key)}
              >
                {l.ingredientId ? ingredientName(l.ingredientId) : 'Choisir un ingrédient…'}
              </button>
              <button
                type="button"
                className="btn icon ghost sm"
                aria-label="Retirer la ligne"
                onClick={() => setLines((ls) => ls.filter((x) => x.key !== l.key))}
              >
                <TrashIcon size={16} />
              </button>
            </div>
            <div className="grid">
              <input
                className="input"
                inputMode="decimal"
                placeholder="Qté"
                value={l.qty}
                disabled={l.unit === 'rincage'}
                onChange={(e) => updateLine(l.key, { qty: e.target.value })}
              />
              <select
                className="select"
                value={l.unit}
                onChange={(e) => updateLine(l.key, { unit: e.target.value as UnitId | '' })}
              >
                <option value="">— sans unité —</option>
                {UNIT_OPTIONS.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>
            <input
              className="input"
              placeholder="Précision (ex. jus frais, pour décorer…)"
              value={l.note}
              onChange={(e) => updateLine(l.key, { note: e.target.value })}
            />
            <label className="checkbox">
              <input type="checkbox" checked={l.optional} onChange={(e) => updateLine(l.key, { optional: e.target.checked })} />
              Facultatif (décoration…)
            </label>
          </div>
        ))}
        <button type="button" className="btn ghost" onClick={() => setLines((ls) => [...ls, emptyLine()])}>
          <PlusIcon size={18} /> Ajouter un ingrédient
        </button>
      </section>

      <section className="card stack">
        <h2 className="section-title">Degré d'alcool</h2>
        <p className="muted" style={{ margin: 0 }}>
          Estimé d'après les ingrédients et la dilution : <strong>{formatAbv(estimate)}</strong>. Laisse vide pour
          garder l'estimation.
        </p>
        <label className="field">
          <span>Degré personnalisé (%)</span>
          <input
            className="input"
            inputMode="decimal"
            placeholder={estimate.alcoholFree ? '0' : String(Math.round(estimate.abv))}
            value={abv}
            onChange={(e) => setAbv(e.target.value)}
          />
        </label>
      </section>

      <section className="card stack">
        <h2 className="section-title">Préparation</h2>
        <label className="field">
          <span>Une étape par ligne</span>
          <textarea
            className="textarea"
            value={steps}
            onChange={(e) => setSteps(e.target.value)}
            placeholder={'Frapper au shaker avec de la glace.\nFiltrer dans une coupe.'}
          />
        </label>
      </section>

      {error && <p className="error">{error}</p>}
      <button type="submit" className="btn pink block">
        {existing ? 'Enregistrer les modifications' : 'Créer la recette'}
      </button>

      {picking && (
        <Sheet title="Choisir un ingrédient" onClose={() => setPicking(null)}>
          <IngredientList
            allowCreate
            onSelect={(ingredientId) => {
              updateLine(picking, { ingredientId })
              setPicking(null)
            }}
          />
        </Sheet>
      )}
    </form>
  )
}
