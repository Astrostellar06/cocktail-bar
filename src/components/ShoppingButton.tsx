import { setShopping } from '../lib/actions'
import { useBar } from '../state/BarContext'
import { CartIcon } from './icons'
import { useToast } from './Toast'

/** Ajoute ou retire un ingrédient de la liste de courses. */
export function ShoppingButton({ ingredientId, name }: { ingredientId: string; name: string }) {
  const { shoppingIds } = useBar()
  const toast = useToast()
  const listed = shoppingIds.has(ingredientId)

  return (
    <button
      type="button"
      className={`btn icon sm shop-btn${listed ? ' on' : ' ghost'}`}
      aria-pressed={listed}
      aria-label={listed ? `Retirer ${name} de la liste de courses` : `Ajouter ${name} à la liste de courses`}
      title={listed ? 'Sur la liste de courses' : 'Ajouter à la liste de courses'}
      onClick={async () => {
        await setShopping(ingredientId, !listed)
        toast(listed ? 'Retiré de la liste de courses' : 'Ajouté à la liste de courses')
      }}
    >
      <CartIcon size={18} filled={listed} />
    </button>
  )
}
