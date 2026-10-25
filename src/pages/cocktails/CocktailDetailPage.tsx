import { Link, useNavigate, useParams } from 'react-router'
import { AbvBadge } from '../../components/CocktailCard'
import { useConfirm } from '../../components/Dialog'
import { FavoriteButton } from '../../components/FavoriteButton'
import { ShoppingButton } from '../../components/ShoppingButton'
import { BackIcon, CheckIcon, CloseIcon, CopyIcon, EditIcon, GlassIcon, PlusIcon, SwapIcon, TrashIcon } from '../../components/icons'
import { useToast } from '../../components/Toast'
import { GLASSES, METHODS } from '../../data/meta'
import { acquire, deleteCocktail, isBaseCocktail, restoreOriginal } from '../../lib/actions'
import { pastelFor } from '../../lib/colors'
import type { LineCheck } from '../../lib/matching'
import { useGoBack } from '../../lib/navigation'
import { formatAmount, plural } from '../../lib/text'
import { useBar, useIngredientName } from '../../state/BarContext'

export function CocktailDetailPage() {
  const { id = '' } = useParams()
  const { checkById, cocktailById, ingredientById, abvById } = useBar()
  const name = useIngredientName()
  const navigate = useNavigate()
  const goBack = useGoBack('/cocktails')
  const toast = useToast()
  const confirm = useConfirm()
  const check = checkById.get(id)

  if (!check) {
    return (
      <div className="page">
        <div className="card empty">
          <p>Ce cocktail n'existe pas (ou plus).</p>
          <Link to="/cocktails" className="btn">
            Voir les cocktails
          </Link>
        </div>
      </div>
    )
  }

  const { cocktail, lines, status, missing, usesSubstitute } = check
  const base = isBaseCocktail(cocktail.id)
  const abv = abvById.get(cocktail.id)
  const original = cocktail.basedOn ? cocktailById.get(cocktail.basedOn) : undefined
  const substitutions = lines.filter((l) => l.status === 'substitut' && !l.line.optional)

  async function remove() {
    const ok = await confirm({
      title: `Supprimer « ${cocktail.name} » ?`,
      message: base
        ? 'La recette disparaît de la liste. Tu pourras la restaurer depuis les réglages.'
        : 'Ta recette sera supprimée définitivement.',
      confirmLabel: 'Supprimer',
      danger: true,
    })
    if (!ok) return
    await deleteCocktail(cocktail.id)
    toast('Recette supprimée')
    navigate('/cocktails', { replace: true })
  }

  async function restore() {
    const ok = await confirm({
      title: "Revenir à l'original ?",
      message: `Tes modifications de « ${cocktail.name} » seront perdues.`,
      confirmLabel: 'Restaurer',
    })
    if (!ok) return
    await restoreOriginal(cocktail.id)
    toast("Recette d'origine restaurée")
  }

  return (
    <div className="page">
      <header className="page-header">
        <button className="btn icon ghost" onClick={goBack} aria-label="Retour">
          <BackIcon />
        </button>
        <span className="spacer" />
        <FavoriteButton id={cocktail.id} name={cocktail.name} className="in-header" />
        <Link to={`/cocktails/${cocktail.id}/modifier`} className="btn sm">
          <EditIcon size={16} /> Modifier
        </Link>
        <button className="btn icon danger sm" onClick={remove} aria-label="Supprimer la recette" title="Supprimer">
          <TrashIcon size={18} />
        </button>
      </header>

      <section className="card hero">
        <div className="hero-art">
          <HeroShapes />
          <div className="hero-disc" style={{ background: pastelFor(cocktail.id) }}>
            <GlassIcon glass={cocktail.glass} color={cocktail.color} size={112} />
          </div>
        </div>
        <h1 className="title">{cocktail.name}</h1>
        {cocktail.description && <p>{cocktail.description}</p>}
        <div className="row wrap" style={{ justifyContent: 'center', marginTop: 12 }}>
          {abv && <AbvBadge info={abv} />}
          <span className="badge" style={{ background: 'var(--white)' }}>
            {GLASSES[cocktail.glass]}
          </span>
          <span className="badge" style={{ background: 'var(--white)' }}>
            {METHODS[cocktail.method]}
          </span>
          {cocktail.custom && <span className="badge perso">Ma recette</span>}
          {cocktail.edited && <span className="badge perso">Modifiée</span>}
        </div>
        {original && (
          <p className="muted">
            Variante de <Link to={`/cocktails/${original.id}`}>{original.name}</Link>
          </p>
        )}
      </section>

      <section className={`status-banner ${status}`}>
        {status === 'faisable' ? (
          <>
            <strong>Tu peux le préparer !</strong>
            {usesSubstitute && (
              <span>
                Avec substitut :{' '}
                {substitutions.map((l) => `${name(l.substituteId!)} au lieu de ${name(l.line.ingredientId)}`).join(', ')}.
              </span>
            )}
          </>
        ) : (
          <>
            <strong>Il te manque {plural(missing.length, 'ingrédient')}</strong>
            {missing.map((id) => {
              const ingredient = ingredientById.get(id)
              return (
                <div key={id} className="missing-row">
                  <span className="grow">{name(id)}</span>
                  {ingredient && <ShoppingButton ingredientId={id} name={ingredient.name} />}
                  {ingredient && (
                    <button
                      className="btn sm ghost"
                      onClick={async () => {
                        await acquire(ingredient)
                        toast(`${ingredient.name} rejoint le bar !`)
                      }}
                    >
                      <PlusIcon size={14} /> Je l'ai
                    </button>
                  )}
                </div>
              )
            })}
          </>
        )}
      </section>

      <section className="card">
        <h2 className="section-title">Ingrédients</h2>
        <ul className="recipe-lines">
          {lines.map((l, i) => (
            <RecipeLineRow key={i} check={l} />
          ))}
        </ul>
      </section>

      <section className="card">
        <h2 className="section-title">Préparation</h2>
        <ol className="steps">
          {cocktail.steps.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
      </section>

      <div className="stack">
        <Link to={`/cocktails/nouveau?depuis=${cocktail.id}`} className="btn ghost block">
          <CopyIcon size={18} /> Créer une variante
        </Link>
        {cocktail.edited && (
          <button className="btn ghost block" onClick={restore}>
            Revenir à la recette d'origine
          </button>
        )}
      </div>
    </div>
  )
}

function RecipeLineRow({ check }: { check: LineCheck }) {
  const name = useIngredientName()
  const { line, status, substituteId } = check
  const notes = [line.unit === 'top' && line.qty && 'pour compléter', line.note, line.optional && 'facultatif'].filter(Boolean)
  return (
    <li className={`${status}${line.optional ? ' optional' : ''}`}>
      <span className="amount">{formatAmount(line)}</span>
      <span className="what">
        {name(line.ingredientId)}
        {notes.length > 0 && <small>{notes.join(' · ')}</small>}
        {substituteId && <small>→ avec {name(substituteId)}</small>}
      </span>
      <span className={`mark ${status}`} title={status === 'ok' ? 'Dans mon bar' : status === 'substitut' ? 'Substitut' : 'Manquant'}>
        {status === 'ok' ? <CheckIcon size={14} /> : status === 'substitut' ? <SwapIcon size={14} /> : <CloseIcon size={14} />}
      </span>
    </li>
  )
}

/** Formes Memphis autour du verre, cantonnées à la zone d'illustration pour ne jamais passer sous le texte. */
function HeroShapes() {
  return (
    <svg className="shapes" viewBox="0 0 320 170" aria-hidden="true">
      <path d="M22 58l22-38 22 38z" fill="#FFD23F" stroke="#1D1A3B" strokeWidth="3" strokeLinejoin="round" />
      <path d="M252 30q8-12 16 0t16 0t16 0" fill="none" stroke="#FF4FA3" strokeWidth="5" strokeLinecap="round" />
      <rect x="262" y="104" width="28" height="28" fill="#19C3B1" stroke="#1D1A3B" strokeWidth="3" transform="rotate(18 276 118)" />
      <g fill="#1D1A3B">
        <circle cx="36" cy="120" r="3" />
        <circle cx="48" cy="120" r="3" />
        <circle cx="42" cy="130" r="3" />
      </g>
      <path d="M266 64l12 12m0-12l-12 12" stroke="#8B5CF6" strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
}
