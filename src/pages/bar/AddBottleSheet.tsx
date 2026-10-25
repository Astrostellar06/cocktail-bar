import { useState } from 'react'
import { BottleIcon } from '../../components/icons'
import { IngredientList } from '../../components/IngredientList'
import { Sheet } from '../../components/Sheet'
import { useToast } from '../../components/Toast'
import { GROUPS, GROUP_BY_ID } from '../../data/ingredients'
import { addBottle } from '../../lib/actions'
import { useBar } from '../../state/BarContext'

const BOTTLE_GROUPS = GROUPS.filter((g) => g.kind === 'bouteille').map((g) => g.id)

/** Ajout de bouteilles en deux temps : type d'ingrédient, puis marque facultative. Reste ouvert pour enchaîner. */
export function AddBottleSheet({ onClose }: { onClose: () => void }) {
  const { ingredientById } = useBar()
  const toast = useToast()
  const [selected, setSelected] = useState<string | null>(null)
  const [label, setLabel] = useState('')

  const ingredient = selected ? ingredientById.get(selected) : undefined
  const group = ingredient ? GROUP_BY_ID.get(ingredient.group) : undefined

  async function add() {
    if (!ingredient) return
    await addBottle(ingredient.id, label)
    toast(`${label.trim() || ingredient.name} rejoint le bar !`)
    setSelected(null)
    setLabel('')
  }

  return (
    <Sheet title="Ajouter une bouteille" onClose={onClose}>
      {!ingredient || !group ? (
        <IngredientList
          onSelect={setSelected}
          groups={BOTTLE_GROUPS}
          allowCreate
          createLabel="Pas dans la liste ? Ajouter une autre bouteille"
          placeholder="Rhum, tonic, Campari…"
        />
      ) : (
        <form
          className="stack"
          onSubmit={(e) => {
            e.preventDefault()
            add()
          }}
        >
          <div className="card row">
            <BottleIcon group={group.id} color={group.color} size={56} />
            <div>
              <strong>{ingredient.name}</strong>
              <div className="muted">{group.name}</div>
            </div>
          </div>
          <label className="field">
            <span>Marque ou nom (facultatif)</span>
            <input
              className="input"
              autoFocus
              placeholder="ex. Havana Club 3 ans"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </label>
          <button className="btn pink block" type="submit">
            Ajouter au bar
          </button>
          <button className="btn ghost block" type="button" onClick={() => setSelected(null)}>
            Choisir un autre ingrédient
          </button>
        </form>
      )}
    </Sheet>
  )
}
