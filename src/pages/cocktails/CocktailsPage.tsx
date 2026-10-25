import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { CocktailCard } from '../../components/CocktailCard'
import { CloseIcon, FilterIcon, GlassIcon, HeartIcon, PlusIcon, SearchIcon } from '../../components/icons'
import { IngredientList } from '../../components/IngredientList'
import { Sheet } from '../../components/Sheet'
import { FAMILIES } from '../../data/ingredients'
import { containsFilter, type CocktailCheck, type CocktailStatus } from '../../lib/matching'
import { normalize, plural } from '../../lib/text'
import { useBar } from '../../state/BarContext'

type View = CocktailStatus | 'tous'

const VIEWS: { id: View; label: string }[] = [
  { id: 'faisable', label: 'Faisables' },
  { id: 'presque', label: 'Presque' },
  { id: 'autre', label: 'Autres' },
  { id: 'tous', label: 'Tous' },
]

type Sort = 'manquants' | 'nom' | 'fort' | 'leger'

const SORTS: { id: Sort; label: string }[] = [
  { id: 'manquants', label: 'Ingrédients manquants' },
  { id: 'nom', label: 'Nom (A → Z)' },
  { id: 'fort', label: 'Plus fort d’abord' },
  { id: 'leger', label: 'Plus léger d’abord' },
]

/** Dans « Faisables », rien ne manque : le tri par ingrédients manquants y serait identique au tri par nom. */
const sortsFor = (view: View) => (view === 'faisable' ? SORTS.filter((s) => s.id !== 'manquants') : SORTS)
const defaultSort = (view: View): Sort => (view === 'faisable' ? 'nom' : 'manquants')

const byName = (a: CocktailCheck, b: CocktailCheck) => a.cocktail.name.localeCompare(b.cocktail.name, 'fr')

export function CocktailsPage() {
  const { checks, ingredientById, bottles, abvById, favorites } = useBar()
  const [params, setParams] = useSearchParams()
  const [picking, setPicking] = useState(false)

  // L'état des filtres vit dans l'URL : il est conservé au retour d'une fiche cocktail.
  const view = (VIEWS.find((v) => v.id === params.get('vue'))?.id ?? 'faisable') as View
  const query = params.get('q') ?? ''
  const filters = params.get('ing')?.split(',').filter(Boolean) ?? []
  const persoOnly = params.get('perso') === '1'
  const alcoholFreeOnly = params.get('sansalcool') === '1'
  const favoritesOnly = params.get('favoris') === '1'
  const sorts = sortsFor(view)
  const sort = sorts.find((s) => s.id === params.get('tri'))?.id ?? defaultSort(view)

  const update = (changes: Record<string, string | null>) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        for (const [key, value] of Object.entries(changes)) {
          if (value) next.set(key, value)
          else next.delete(key)
        }
        return next
      },
      { replace: true },
    )

  const q = normalize(query)
  const matching = checks.filter(
    (c) =>
      (!q || normalize(c.cocktail.name).includes(q)) &&
      (!favoritesOnly || favorites.has(c.cocktail.id)) &&
      (!persoOnly || c.cocktail.custom) &&
      (!alcoholFreeOnly || abvById.get(c.cocktail.id)?.alcoholFree) &&
      filters.every((f) => containsFilter(c.cocktail, f, ingredientById)),
  )
  const counts: Record<View, number> = {
    faisable: matching.filter((c) => c.status === 'faisable').length,
    presque: matching.filter((c) => c.status === 'presque').length,
    autre: matching.filter((c) => c.status === 'autre').length,
    tous: matching.length,
  }
  const abv = (c: CocktailCheck) => abvById.get(c.cocktail.id)?.abv ?? 0
  const compare = {
    manquants: (a: CocktailCheck, b: CocktailCheck) => a.missing.length - b.missing.length || byName(a, b),
    nom: byName,
    fort: (a: CocktailCheck, b: CocktailCheck) => abv(b) - abv(a) || byName(a, b),
    leger: (a: CocktailCheck, b: CocktailCheck) => abv(a) - abv(b) || byName(a, b),
  }[sort]
  const list = (view === 'tous' ? matching : matching.filter((c) => c.status === view)).sort(compare)

  const filterLabel = (f: string) =>
    f.startsWith('f:') ? FAMILIES[f.slice(2)] ?? f : ingredientById.get(f)?.name ?? f

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="title">Cocktails</h1>
        <span className="spacer" />
        <Link to="/cocktails/nouveau" className="btn pink sm">
          <PlusIcon size={16} /> Créer
        </Link>
      </header>

      <div className="search">
        <SearchIcon />
        <input
          className="input"
          type="search"
          placeholder="Rechercher un cocktail…"
          value={query}
          onChange={(e) => update({ q: e.target.value })}
        />
        {query && (
          <button className="clear" onClick={() => update({ q: null })} aria-label="Effacer la recherche">
            <CloseIcon size={18} />
          </button>
        )}
      </div>

      <div className="chips">
        <button
          className={`chip${favoritesOnly ? ' on fav' : ''}`}
          aria-pressed={favoritesOnly}
          onClick={() => update({ favoris: favoritesOnly ? null : '1' })}
        >
          <HeartIcon size={14} filled={favoritesOnly} /> Favoris
        </button>
        {filters.map((f) => (
          <button
            key={f}
            className="chip filter"
            onClick={() => update({ ing: filters.filter((x) => x !== f).join(',') })}
            aria-label={`Retirer le filtre ${filterLabel(f)}`}
          >
            {filterLabel(f)} <CloseIcon size={14} />
          </button>
        ))}
        <button className="chip add" onClick={() => setPicking(true)}>
          <FilterIcon size={14} /> {filters.length ? 'Ingrédient' : 'Filtrer par ingrédient'}
        </button>
        <button
          className={`chip${persoOnly ? ' on' : ''}`}
          aria-pressed={persoOnly}
          onClick={() => update({ perso: persoOnly ? null : '1' })}
        >
          Mes recettes
        </button>
        <button
          className={`chip${alcoholFreeOnly ? ' on' : ''}`}
          aria-pressed={alcoholFreeOnly}
          onClick={() => update({ sansalcool: alcoholFreeOnly ? null : '1' })}
        >
          Sans alcool
        </button>
      </div>

      <div className="segmented" role="tablist">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            role="tab"
            aria-selected={view === v.id}
            className={view === v.id ? 'active' : undefined}
            data-tone={v.id}
            onClick={() => update({ vue: v.id === 'faisable' ? null : v.id })}
          >
            <strong>{counts[v.id]}</strong>
            {v.label}
          </button>
        ))}
      </div>

      <div className="list-toolbar">
        <span className="muted">{plural(list.length, 'cocktail')}</span>
        <label className="row">
          <span className="muted">Trier</span>
          <select
            className="select sm"
            value={sort}
            // Le tri par défaut de l'onglet n'est pas mémorisé : chaque onglet garde ainsi le sien.
            onChange={(e) => update({ tri: e.target.value === defaultSort(view) ? null : e.target.value })}
          >
            {sorts.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {list.length > 0 ? (
        <div className="stack">
          {list.map((c) => (
            <CocktailCard key={c.cocktail.id} check={c} />
          ))}
        </div>
      ) : (
        <EmptyState
          view={view}
          counts={counts}
          barEmpty={bottles.length === 0}
          noFavorites={favoritesOnly && favorites.size === 0}
          onSwitch={(v) => update({ vue: v === 'faisable' ? null : v })}
        />
      )}

      {picking && (
        <Sheet title="Filtrer par ingrédient" onClose={() => setPicking(false)}>
          <p className="muted" style={{ margin: 0 }}>
            Seuls les cocktails contenant <strong>tous</strong> les ingrédients choisis seront affichés.
          </p>
          <IngredientList
            families
            exclude={filters}
            onSelect={(choice) => {
              update({ ing: [...filters, choice].join(',') })
              setPicking(false)
            }}
          />
        </Sheet>
      )}
    </div>
  )
}

function EmptyState({
  view,
  counts,
  barEmpty,
  noFavorites,
  onSwitch,
}: {
  view: View
  counts: Record<View, number>
  barEmpty: boolean
  noFavorites: boolean
  onSwitch: (v: View) => void
}) {
  const elsewhere = VIEWS.filter((v) => v.id !== view && v.id !== 'tous' && counts[v.id] > 0)

  return (
    <div className="card empty">
      <GlassIcon glass="martini" color="var(--paper)" size={72} />
      {noFavorites ? (
        <p>
          <strong>Pas encore de favoris.</strong>
          <br />
          Touche le cœur d'une recette pour la retrouver ici.
        </p>
      ) : view === 'faisable' && barEmpty ? (
        <>
          <p>
            <strong>Ton bar est vide.</strong>
            <br />
            Ajoute tes bouteilles pour voir ce que tu peux préparer.
          </p>
          <Link to="/" className="btn pink">
            Remplir mon bar
          </Link>
        </>
      ) : elsewhere.length > 0 ? (
        <>
          <p>Rien ici… mais il y en a ailleurs :</p>
          <div className="row wrap" style={{ justifyContent: 'center' }}>
            {elsewhere.map((v) => (
              <button key={v.id} className="btn sm ghost" onClick={() => onSwitch(v.id)}>
                {counts[v.id]} {v.label.toLowerCase()}
              </button>
            ))}
          </div>
        </>
      ) : (
        <p>Aucun cocktail ne correspond.</p>
      )}
    </div>
  )
}
