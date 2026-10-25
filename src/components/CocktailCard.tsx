import { Fragment } from 'react'
import { Link } from 'react-router'
import { formatAbv, type AbvInfo } from '../lib/abv'
import { pastelFor } from '../lib/colors'
import type { CocktailCheck } from '../lib/matching'
import { useBar, useIngredientName } from '../state/BarContext'
import { FavoriteButton } from './FavoriteButton'
import { CheckIcon, GlassIcon, SwapIcon } from './icons'

export function CocktailCard({ check }: { check: CocktailCheck }) {
  const { cocktail, missing } = check
  const name = useIngredientName(true)
  const { abvById, ingredientById } = useBar()
  const abv = abvById.get(cocktail.id)
  // Résumé : ingrédients obligatoires, sans ceux toujours disponibles (l'eau).
  const required = [
    ...new Set(
      cocktail.ingredients
        .filter((l) => !l.optional && !ingredientById.get(l.ingredientId)?.always)
        .map((l) => l.ingredientId),
    ),
  ]

  // Le cœur est un frère du lien (et non un enfant) : un bouton ne peut pas être imbriqué dans un lien.
  return (
    <div className="cocktail-item">
      <Link to={`/cocktails/${cocktail.id}`} className="cocktail-card">
        <div className="glass-bubble" style={{ background: pastelFor(cocktail.id) }}>
          <GlassIcon glass={cocktail.glass} color={cocktail.color} size={46} />
        </div>
        <div className="body">
          <div className="row">
            <h3>{cocktail.name}</h3>
            {cocktail.custom && <span className="badge perso">Perso</span>}
          </div>
          <div className="ings">
            {required.map((id, i) => (
              <Fragment key={id}>
                {i > 0 && ' · '}
                <span className={missing.includes(id) ? 'miss' : undefined}>{name(id)}</span>
              </Fragment>
            ))}
          </div>
          <div className="row wrap" style={{ gap: 6 }}>
            <StatusBadge check={check} />
            {abv && <AbvBadge info={abv} />}
          </div>
        </div>
      </Link>
      <FavoriteButton id={cocktail.id} name={cocktail.name} className="on-card" />
    </div>
  )
}

export function StatusBadge({ check }: { check: CocktailCheck }) {
  const name = useIngredientName(true)
  const { status, missing, usesSubstitute } = check

  if (status === 'faisable') {
    return (
      <span className="badge faisable">
        {usesSubstitute ? <SwapIcon size={13} /> : <CheckIcon size={13} />}
        {usesSubstitute ? 'Faisable avec substitut' : 'Faisable'}
      </span>
    )
  }
  const label =
    missing.length <= 2 ? `Manque : ${missing.map(name).join(', ')}` : `Manque ${missing.length} ingrédients`
  return <span className={`badge ${status}`}>{label}</span>
}

export function AbvBadge({ info }: { info: AbvInfo }) {
  return <span className={`badge abv${info.alcoholFree ? ' zero' : ''}`}>{formatAbv(info)}</span>
}
