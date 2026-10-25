import { useState, type CSSProperties } from 'react'
import { Link } from 'react-router'
import { BottleIcon, PlusIcon, SettingsIcon } from '../../components/icons'
import { useToast } from '../../components/Toast'
import { GROUPS } from '../../data/ingredients'
import type { Group } from '../../data/types'
import { acquire, setPantry } from '../../lib/actions'
import type { BottleRow } from '../../lib/db'
import { purchaseSuggestions } from '../../lib/matching'
import { shortName } from '../../lib/text'
import { useBar } from '../../state/BarContext'
import { AddBottleSheet } from './AddBottleSheet'
import { BottleSheet } from './BottleSheet'

export function BarPage() {
  const { bottles, checks, ingredientById } = useBar()
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<BottleRow | null>(null)

  const makeable = checks.filter((c) => c.status === 'faisable').length
  const shelves = GROUPS.filter((g) => g.kind === 'bouteille')
    .map((group) => ({
      group,
      bottles: bottles
        .filter((b) => ingredientById.get(b.ingredientId)?.group === group.id)
        .sort((a, b) => (ingredientById.get(a.ingredientId)?.name ?? '').localeCompare(ingredientById.get(b.ingredientId)?.name ?? '', 'fr')),
    }))
    .filter((s) => s.bottles.length > 0)

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="title">Mon bar</h1>
        <span className="spacer" />
        <Link to="/reglages" className="btn icon ghost" aria-label="Réglages">
          <SettingsIcon />
        </Link>
      </header>

      <div className="stats">
        <div className="stat" style={{ background: 'var(--pink)', color: 'var(--white)' }}>
          <strong>{bottles.length}</strong>
          <span>bouteille{bottles.length > 1 ? 's' : ''}</span>
        </div>
        <Link to="/cocktails" className="stat" style={{ background: 'var(--teal)' }}>
          <strong>{makeable}</strong>
          <span>cocktail{makeable > 1 ? 's' : ''} faisable{makeable > 1 ? 's' : ''}</span>
          <span className="go" aria-hidden="true">→</span>
        </Link>
      </div>

      <button className="btn pink block" onClick={() => setAdding(true)}>
        <PlusIcon /> Ajouter une bouteille
      </button>

      {shelves.length === 0 ? (
        <div className="card empty">
          <BottleIcon group="spiritueux" color="var(--orange)" size={80} />
          <p>
            <strong>Ton bar est vide.</strong>
            <br />
            Ajoute tes bouteilles pour découvrir les cocktails que tu peux préparer.
          </p>
        </div>
      ) : (
        shelves.map(({ group, bottles }) => (
          <Shelf key={group.id} group={group} bottles={bottles} onOpen={setEditing} />
        ))
      )}

      <Pantry />
      <Suggestions />

      {adding && <AddBottleSheet onClose={() => setAdding(false)} />}
      {editing && <BottleSheet bottle={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}

function Shelf({ group, bottles, onOpen }: { group: Group; bottles: BottleRow[]; onOpen: (b: BottleRow) => void }) {
  const { ingredientById } = useBar()
  return (
    <section>
      <h2 className="section-title">
        <span className="dot" style={{ background: group.color }} />
        {group.name}
        <span className="muted">· {bottles.length}</span>
      </h2>
      <div className="shelf" style={{ '--shelf-color': group.color } as CSSProperties}>
        {bottles.map((b) => {
          const name = shortName(ingredientById.get(b.ingredientId)?.name ?? b.ingredientId)
          return (
            <button key={b.id} className="bottle" onClick={() => onOpen(b)}>
              <span className="label">{b.label || name}</span>
              {b.label && <span className="brand">{name}</span>}
              <BottleIcon group={group.id} color={group.color} size={68} />
            </button>
          )
        })}
      </div>
    </section>
  )
}

function Pantry() {
  const { ingredients, pantry } = useBar()
  const groups = GROUPS.filter((g) => g.kind === 'garde-manger')

  return (
    <section>
      <h2 className="section-title">
        <span className="dot" style={{ background: 'var(--green)' }} />
        Frais & épicerie
      </h2>
      <div className="card stack">
        <p className="muted" style={{ margin: 0 }}>
          Coche ce que tu as sous la main. Les glaçons et l'eau sont toujours considérés comme disponibles.
        </p>
        {groups.map((g) => (
          <div key={g.id} className="stack" style={{ gap: 8 }}>
            <strong>{g.name}</strong>
            <div className="chips">
              {ingredients
                .filter((i) => i.group === g.id && !i.always)
                .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
                .map((i) => {
                  const on = pantry.has(i.id)
                  return (
                    <button
                      key={i.id}
                      className={`chip${on ? ' on' : ''}`}
                      aria-pressed={on}
                      onClick={() => setPantry(i.id, !on)}
                    >
                      {i.name}
                    </button>
                  )
                })}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function Suggestions() {
  const { checks, ingredientById } = useBar()
  const toast = useToast()
  const suggestions = purchaseSuggestions(checks).slice(0, 5)
  if (suggestions.length === 0) return null

  return (
    <section>
      <h2 className="section-title">
        <span className="dot" style={{ background: 'var(--yellow)' }} />
        Prochains achats
      </h2>
      <div className="card">
        <p className="muted" style={{ marginTop: 0 }}>
          Ce qui débloquerait le plus de cocktails, à lui seul.
        </p>
        {suggestions.map((s, i) => {
          const ingredient = ingredientById.get(s.ingredientId)
          if (!ingredient) return null
          return (
            <div key={s.ingredientId} className="suggestion">
              <span className="rank">+{s.unlocks.length}</span>
              <div className="info">
                <strong>{ingredient.name}</strong>
                <small>{s.unlocks.map((c) => c.name).join(', ')}</small>
              </div>
              <button
                className={`btn sm ${i === 0 ? 'teal' : 'ghost'}`}
                onClick={async () => {
                  await acquire(ingredient)
                  toast(`${ingredient.name} rejoint le bar !`)
                }}
              >
                Je l'ai
              </button>
            </div>
          )
        })}
      </div>
    </section>
  )
}
