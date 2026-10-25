import { useState } from 'react'
import { BottleIcon } from '../../components/icons'
import { Sheet } from '../../components/Sheet'
import { useToast } from '../../components/Toast'
import { GROUPS, GROUP_BY_ID } from '../../data/ingredients'
import type { GroupId } from '../../data/types'
import { removeBottle, updateBottle, updateIngredient } from '../../lib/actions'
import type { BottleRow } from '../../lib/db'
import { useBar } from '../../state/BarContext'

const BOTTLE_GROUPS = GROUPS.filter((g) => g.kind === 'bouteille')

/** Détail d'une bouteille du bar : renommer, retirer, et corriger l'ingrédient s'il a été créé par l'utilisateur. */
export function BottleSheet({ bottle, onClose }: { bottle: BottleRow; onClose: () => void }) {
  const { ingredientById, checks } = useBar()
  const toast = useToast()
  const ingredient = ingredientById.get(bottle.ingredientId)
  const [label, setLabel] = useState(bottle.label ?? '')
  const [name, setName] = useState(ingredient?.name ?? '')
  const [group, setGroup] = useState<GroupId>(ingredient?.group ?? 'spiritueux')
  const [abv, setAbv] = useState(ingredient?.abv !== undefined ? String(ingredient.abv).replace('.', ',') : '')
  const groupInfo = GROUP_BY_ID.get(group)
  const usedIn = checks.filter(
    (c) => c.status === 'faisable' && c.cocktail.ingredients.some((l) => l.ingredientId === bottle.ingredientId),
  ).length

  async function save() {
    await updateBottle(bottle.id!, { label })
    if (ingredient?.custom && name.trim()) {
      const degree = parseFloat(abv.replace(',', '.'))
      await updateIngredient(ingredient.id, {
        name,
        group,
        abv: groupInfo?.defaultAbv !== undefined && degree > 0 ? degree : undefined,
      })
    }
    onClose()
  }

  async function remove() {
    if (!confirm(`Retirer ${bottle.label || ingredient?.name} du bar ?`)) return
    await removeBottle(bottle.id!)
    toast('Bouteille retirée')
    onClose()
  }

  return (
    <Sheet title={ingredient?.name ?? 'Bouteille'} onClose={onClose}>
      <div className="card row">
        {groupInfo && <BottleIcon group={groupInfo.id} color={groupInfo.color} size={64} />}
        <div>
          <strong>{bottle.label || ingredient?.name}</strong>
          <div className="muted">{groupInfo?.name}</div>
          <div className="muted">
            Utilisée dans {usedIn} cocktail{usedIn > 1 ? 's' : ''} faisable{usedIn > 1 ? 's' : ''}
          </div>
        </div>
      </div>
      <form
        className="stack"
        onSubmit={(e) => {
          e.preventDefault()
          save()
        }}
      >
        <label className="field">
          <span>Marque ou nom</span>
          <input className="input" placeholder={ingredient?.name} value={label} onChange={(e) => setLabel(e.target.value)} />
        </label>
        {ingredient?.custom && (
          <div className="card tight stack">
            <strong>Ingrédient créé par toi</strong>
            <label className="field">
              <span>Nom de l'ingrédient</span>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className="field">
              <span>Rayon</span>
              <select className="select" value={group} onChange={(e) => setGroup(e.target.value as GroupId)}>
                {BOTTLE_GROUPS.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </label>
            {groupInfo?.defaultAbv !== undefined && (
              <label className="field">
                <span>Degré d'alcool (%)</span>
                <input
                  className="input"
                  inputMode="decimal"
                  placeholder={String(groupInfo.defaultAbv)}
                  value={abv}
                  onChange={(e) => setAbv(e.target.value)}
                />
              </label>
            )}
          </div>
        )}
        <button className="btn teal block" type="submit">
          Enregistrer
        </button>
      </form>
      <button className="btn danger block" onClick={remove}>
        Retirer du bar
      </button>
    </Sheet>
  )
}
