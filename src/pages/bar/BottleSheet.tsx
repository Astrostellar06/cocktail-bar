import { useState } from 'react'
import { BottleForm } from '../../components/BottleForm'
import { useConfirm } from '../../components/Dialog'
import { Select } from '../../components/Select'
import { Sheet } from '../../components/Sheet'
import { useToast } from '../../components/Toast'
import { GROUPS } from '../../data/ingredients'
import type { GroupId } from '../../data/types'
import { removeBottle, updateBottle, updateIngredient } from '../../lib/actions'
import type { BottleRow } from '../../lib/db'
import { useBar } from '../../state/BarContext'

const BOTTLE_GROUPS = GROUPS.filter((g) => g.kind === 'bouteille')

/** Détail d'une bouteille du bar : modifier, retirer, et corriger l'ingrédient s'il a été créé par l'utilisateur. */
export function BottleSheet({ bottle, onClose }: { bottle: BottleRow; onClose: () => void }) {
  const { ingredientById, checks } = useBar()
  const toast = useToast()
  const confirm = useConfirm()
  const ingredient = ingredientById.get(bottle.ingredientId)
  const [name, setName] = useState(ingredient?.name ?? '')
  const [group, setGroup] = useState<GroupId>(ingredient?.group ?? 'spiritueux')
  const usedIn = checks.filter(
    (c) => c.status === 'faisable' && c.cocktail.ingredients.some((l) => l.ingredientId === bottle.ingredientId),
  ).length

  async function remove() {
    const ok = await confirm({
      title: `Retirer ${bottle.label || ingredient?.name} ?`,
      message: 'La bouteille sera retirée de ton bar.',
      confirmLabel: 'Retirer',
      danger: true,
    })
    if (!ok) return
    await removeBottle(bottle.id!)
    toast('Bouteille retirée')
    onClose()
  }

  return (
    <Sheet title={bottle.label || ingredient?.name || 'Bouteille'} onClose={onClose}>
      <p className="muted" style={{ margin: 0 }}>
        Utilisée dans {usedIn} cocktail{usedIn > 1 ? 's' : ''} faisable{usedIn > 1 ? 's' : ''}.
      </p>
      <BottleForm
        initial={bottle}
        submitLabel="Enregistrer"
        onSubmit={async (values) => {
          await updateBottle(bottle.id!, values)
          if (ingredient?.custom && values.ingredientId === ingredient.id && name.trim()) {
            await updateIngredient(ingredient.id, { name, group, abv: ingredient.abv })
          }
          toast('Bouteille mise à jour')
          onClose()
        }}
        extraFields={
          ingredient?.custom && (
            <div className="card tight stack">
              <strong>Type créé par toi</strong>
              <label className="field">
                <span>Nom du type</span>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
              </label>
              <div className="field">
                <span>Rayon</span>
                <Select
                  title="Rayon"
                  value={group}
                  options={BOTTLE_GROUPS.map((g) => ({ value: g.id, label: g.name }))}
                  onChange={setGroup}
                />
              </div>
            </div>
          )
        }
      />
      <button className="btn danger block" onClick={remove}>
        Retirer du bar
      </button>
    </Sheet>
  )
}
