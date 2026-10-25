import { useState } from 'react'
import { FAMILIES, GROUPS, GROUP_BY_ID } from '../data/ingredients'
import type { GroupId, Ingredient } from '../data/types'
import { createIngredient } from '../lib/actions'
import { normalize } from '../lib/text'
import { useBar } from '../state/BarContext'
import { CheckIcon, CloseIcon, PlusIcon, SearchIcon } from './icons'

interface Props {
  /** Reçoit l'id de l'ingrédient, ou « f:famille » pour une famille. */
  onSelect: (choice: string) => void
  /** Rayons proposés (tous par défaut). */
  groups?: GroupId[]
  /** Propose aussi « Tous les rhums », etc. */
  families?: boolean
  /** Permet de créer un ingrédient qui n'est pas dans la liste. */
  allowCreate?: boolean
  createLabel?: string
  /** Choix à ne pas proposer (déjà sélectionnés). */
  exclude?: string[]
  placeholder?: string
}

/** Liste d'ingrédients avec recherche, regroupée par rayon. */
export function IngredientList({
  onSelect,
  groups,
  families,
  allowCreate,
  createLabel = 'Pas dans la liste ? Créer un ingrédient',
  exclude = [],
  placeholder,
}: Props) {
  const { ingredients, owned } = useBar()
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const allowedGroups = groups ?? GROUPS.map((g) => g.id)

  const q = normalize(query)
  const matches = ingredients
    .filter((i) => allowedGroups.includes(i.group) && !exclude.includes(i.id))
    .filter((i) => !q || normalize(i.name).includes(q))
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
  const familyMatches = families
    ? Object.entries(FAMILIES).filter(
        ([id, label]) => !exclude.includes(`f:${id}`) && (!q || normalize(label).includes(q) || normalize(id).includes(q)),
      )
    : []

  const byGroup = allowedGroups
    .map((g) => ({ group: GROUP_BY_ID.get(g)!, items: matches.filter((i) => i.group === g) }))
    .filter((g) => g.items.length > 0)

  return (
    <>
      <div className="search">
        <SearchIcon />
        <input
          className="input"
          type="search"
          autoFocus={!creating}
          placeholder={placeholder ?? 'Rechercher un ingrédient…'}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button className="clear" onClick={() => setQuery('')} aria-label="Effacer">
            <CloseIcon size={18} />
          </button>
        )}
      </div>

      {allowCreate &&
        (creating ? (
          <CreateIngredientForm
            initialName={query}
            groups={allowedGroups}
            onCancel={() => setCreating(false)}
            onCreated={onSelect}
          />
        ) : (
          <button className="btn ghost block dashed" onClick={() => setCreating(true)}>
            <PlusIcon size={18} /> {createLabel}
          </button>
        ))}

      {familyMatches.length > 0 && (
        <div className="picker-group">
          <h3>Familles</h3>
          <div className="picker-list">
            {familyMatches.map(([id, label]) => (
              <button key={id} className="picker-item" onClick={() => onSelect(`f:${id}`)}>
                <span className="swatch" style={{ background: 'var(--purple)' }} />
                <span className="name">{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {byGroup.map(({ group, items }) => (
        <div className="picker-group" key={group.id}>
          <h3>{group.name}</h3>
          <div className="picker-list">
            {items.map((i) => (
              <IngredientRow key={i.id} ingredient={i} color={group.color} owned={owned.has(i.id)} onSelect={onSelect} />
            ))}
          </div>
        </div>
      ))}

      {byGroup.length === 0 && familyMatches.length === 0 && (
        <p className="muted" style={{ textAlign: 'center' }}>
          Aucun ingrédient ne correspond.
        </p>
      )}
    </>
  )
}

/** Devine le rayon d'après le nom : « Sirop de vanille » → Sirops, « Crème de pêche » → Liqueurs… */
function guessGroup(name: string, allowed: GroupId[]): GroupId {
  const n = normalize(name)
  const rules: [RegExp, GroupId][] = [
    [/^(sirop|cordial)/, 'sirops'],
    [/^(jus|nectar|puree)/, 'jus'],
    [/bitters?\b/, 'bitters'],
    [/^(liqueur|creme de|curacao|schnaps|schnapps)/, 'liqueurs'],
    [/^(vin|vermouth|porto|champagne|cremant|prosecco|cidre|biere|xeres|sherry|madere)/, 'aperitifs'],
    [/(soda|limonade|tonic|^cola|ginger|^eau gazeuse)/, 'softs'],
    [/(rhum|^gin|vodka|whisk|tequila|mezcal|cognac|armagnac|brandy|calvados|eau.de.vie|pisco|cachaca|grappa|^marc)/, 'spiritueux'],
  ]
  return rules.find(([re, g]) => re.test(n) && allowed.includes(g))?.[1] ?? allowed[0]
}

function CreateIngredientForm({
  initialName,
  groups,
  onCancel,
  onCreated,
}: {
  initialName: string
  groups: GroupId[]
  onCancel: () => void
  onCreated: (id: string) => void
}) {
  const { ingredients } = useBar()
  const [name, setName] = useState(initialName.trim())
  const [group, setGroup] = useState<GroupId | null>(null)
  const [abv, setAbv] = useState<string | null>(null)

  // Tant que l'utilisateur n'a rien choisi, le rayon et le degré suivent le nom saisi.
  const effectiveGroup = group ?? guessGroup(name, groups)
  const defaultAbv = GROUP_BY_ID.get(effectiveGroup)?.defaultAbv
  const effectiveAbv = abv ?? (defaultAbv !== undefined ? String(defaultAbv) : '')

  async function submit() {
    if (!name.trim()) return
    const existing = ingredients.find((i) => normalize(i.name) === normalize(name) && groups.includes(i.group))
    if (existing) return onCreated(existing.id)
    const degree = parseFloat(effectiveAbv.replace(',', '.'))
    const created = await createIngredient(name, effectiveGroup, defaultAbv !== undefined && degree > 0 ? degree : undefined)
    onCreated(created.id)
  }

  return (
    <form
      className="card tight stack"
      onSubmit={(e) => {
        // Rendu dans un panneau (portail) : sans stopPropagation, l'envoi remonterait au formulaire de l'éditeur.
        e.preventDefault()
        e.stopPropagation()
        submit()
      }}
    >
      <strong>Nouvel ingrédient</strong>
      <label className="field">
        <span>Nom</span>
        <input
          className="input"
          autoFocus
          placeholder="ex. Sirop de vanille"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <label className="field">
        <span>Rayon</span>
        <select
          className="select"
          value={effectiveGroup}
          onChange={(e) => {
            setGroup(e.target.value as GroupId)
            setAbv(null)
          }}
        >
          {groups.map((g) => (
            <option key={g} value={g}>
              {GROUP_BY_ID.get(g)!.name}
            </option>
          ))}
        </select>
      </label>
      {defaultAbv !== undefined && (
        <label className="field">
          <span>Degré d'alcool (%)</span>
          <input className="input" inputMode="decimal" value={effectiveAbv} onChange={(e) => setAbv(e.target.value)} />
        </label>
      )}
      <div className="row">
        <button type="button" className="btn ghost" onClick={onCancel}>
          Annuler
        </button>
        <button type="submit" className="btn pink" style={{ flex: 1 }} disabled={!name.trim()}>
          Créer
        </button>
      </div>
    </form>
  )
}

function IngredientRow({
  ingredient,
  color,
  owned,
  onSelect,
}: {
  ingredient: Ingredient
  color: string
  owned: boolean
  onSelect: (id: string) => void
}) {
  return (
    <button className="picker-item" onClick={() => onSelect(ingredient.id)}>
      <span className="swatch" style={{ background: color }} />
      <span className="name">{ingredient.name}</span>
      {owned && (
        <span className="badge faisable" title="Dans mon bar">
          <CheckIcon size={12} /> J'ai
        </span>
      )}
    </button>
  )
}
