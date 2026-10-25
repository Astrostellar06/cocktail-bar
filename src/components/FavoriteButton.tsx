import { setFavorite } from '../lib/actions'
import { useBar } from '../state/BarContext'
import { HeartIcon } from './icons'
import { useToast } from './Toast'

/** Cœur pour ajouter ou retirer une recette des favoris. */
export function FavoriteButton({ id, name, className = '' }: { id: string; name: string; className?: string }) {
  const { favorites } = useBar()
  const toast = useToast()
  const on = favorites.has(id)

  return (
    <button
      type="button"
      className={`fav-btn${on ? ' on' : ''} ${className}`}
      aria-pressed={on}
      aria-label={on ? `Retirer ${name} des favoris` : `Ajouter ${name} aux favoris`}
      onClick={async () => {
        await setFavorite(id, !on)
        toast(on ? 'Retiré des favoris' : 'Ajouté aux favoris ♥')
      }}
    >
      <HeartIcon size={20} filled={on} />
    </button>
  )
}
