import { useState } from 'react'
import { useConfirm } from '../components/Dialog'
import { BackIcon, CartIcon, CloseIcon, PlusIcon, ShareIcon } from '../components/icons'
import { IngredientList } from '../components/IngredientList'
import { Sheet } from '../components/Sheet'
import { useToast } from '../components/Toast'
import { GROUPS } from '../data/ingredients'
import { acquire, setShopping } from '../lib/actions'
import { useGoBack } from '../lib/navigation'
import { plural } from '../lib/text'
import { useBar } from '../state/BarContext'

export function ShoppingPage() {
  const { shopping, ingredientById, checks } = useBar()
  const goBack = useGoBack('/')
  const toast = useToast()
  const confirm = useConfirm()
  const [adding, setAdding] = useState(false)

  const items = shopping.map((row) => ingredientById.get(row.ingredientId)).filter((i) => i !== undefined)
  const sections = GROUPS.map((group) => ({ group, items: items.filter((i) => i.group === group.id) })).filter(
    (s) => s.items.length > 0,
  )

  /** Ce que l'achat apporte : cocktails débloqués à lui seul, sinon recettes qui l'attendent. */
  const benefit = (id: string) => {
    const unlocks = checks.filter((c) => c.missing.length === 1 && c.missing[0] === id).length
    if (unlocks) return `Débloque ${plural(unlocks, 'cocktail')}`
    const useful = checks.filter((c) => c.missing.includes(id)).length
    return useful ? `Manque dans ${plural(useful, 'recette')}` : undefined
  }

  async function share() {
    const text = `Liste de courses Mon Bar :\n${items.map((i) => `- ${i.name}`).join('\n')}`
    try {
      if (navigator.share) await navigator.share({ title: 'Liste de courses', text })
      else {
        await navigator.clipboard.writeText(text)
        toast('Liste copiée')
      }
    } catch {
      // Partage annulé par l'utilisateur : rien à faire.
    }
  }

  async function clear() {
    const ok = await confirm({ title: 'Vider la liste ?', message: 'Tous les ingrédients seront retirés de la liste de courses.', confirmLabel: 'Vider', danger: true })
    if (!ok) return
    await Promise.all(items.map((i) => setShopping(i.id, false)))
    toast('Liste vidée')
  }

  return (
    <div className="page">
      <header className="page-header">
        <button className="btn icon ghost" onClick={goBack} aria-label="Retour">
          <BackIcon />
        </button>
        <h1 className="title small">Courses</h1>
        <span className="spacer" />
        {items.length > 0 && (
          <button className="btn icon ghost" onClick={share} aria-label="Partager la liste">
            <ShareIcon size={20} />
          </button>
        )}
      </header>

      <button className="btn pink block" onClick={() => setAdding(true)}>
        <PlusIcon /> Ajouter un ingrédient
      </button>

      {sections.length === 0 ? (
        <div className="card empty">
          <CartIcon size={56} />
          <p>
            <strong>Ta liste est vide.</strong>
            <br />
            Ajoute des ingrédients ici, depuis une recette ou depuis les prochains achats du bar.
          </p>
        </div>
      ) : (
        <>
          {sections.map(({ group, items }) => (
            <section key={group.id}>
              <h2 className="section-title">
                <span className="dot" style={{ background: group.color }} />
                {group.name}
              </h2>
              <div className="card tight">
                {items.map((ingredient) => (
                  <div key={ingredient.id} className="suggestion">
                    <div className="info">
                      <strong>{ingredient.name}</strong>
                      {benefit(ingredient.id) && <small>{benefit(ingredient.id)}</small>}
                    </div>
                    <button
                      className="btn sm ghost"
                      onClick={async () => {
                        await acquire(ingredient)
                        toast(`${ingredient.name} rejoint le bar !`)
                      }}
                    >
                      Je l'ai
                    </button>
                    <button
                      className="btn icon sm ghost"
                      aria-label={`Retirer ${ingredient.name} de la liste`}
                      onClick={() => setShopping(ingredient.id, false)}
                    >
                      <CloseIcon size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          ))}
          <button className="btn ghost block" onClick={clear}>
            Vider la liste
          </button>
        </>
      )}

      {adding && (
        <Sheet title="Ajouter à la liste" onClose={() => setAdding(false)}>
          <IngredientList
            allowCreate
            exclude={items.map((i) => i.id)}
            onSelect={async (id) => {
              await setShopping(id, true)
              setAdding(false)
              toast('Ajouté à la liste de courses')
            }}
          />
        </Sheet>
      )}
    </div>
  )
}
