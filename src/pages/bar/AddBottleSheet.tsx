import { useState } from 'react'
import { BarcodeScanner } from '../../components/BarcodeScanner'
import { BottleForm } from '../../components/BottleForm'
import { BarcodeIcon } from '../../components/icons'
import { IngredientList } from '../../components/IngredientList'
import { Sheet } from '../../components/Sheet'
import { useToast } from '../../components/Toast'
import { GROUPS } from '../../data/ingredients'
import { addBottle, removeBottle, updateBottle } from '../../lib/actions'
import { cutoutBottle } from '../../lib/cutout'
import { lookupProduct, matchProduct, productLabel, type ProductInfo, type ProductMatch } from '../../lib/openFoodFacts'
import { useBar } from '../../state/BarContext'

const BOTTLE_GROUPS = GROUPS.filter((g) => g.kind === 'bouteille').map((g) => g.id)

type Step =
  | { kind: 'pick' }
  | { kind: 'details'; ingredientId: string; barcode?: string }
  | { kind: 'scan' }
  | { kind: 'lookup'; barcode: string }
  | { kind: 'unknown'; barcode: string; product?: ProductInfo; match?: ProductMatch; image?: string }
  | { kind: 'added'; bottleId: number }
  | { kind: 'error'; barcode: string; message: string }

/**
 * Ajout de bouteilles : à la main (type, puis marque et degré) ou par scan du code-barres. Un produit reconnu est
 * ajouté aussitôt, puis reste modifiable. Le panneau reste ouvert pour enchaîner.
 */
export function AddBottleSheet({ onClose }: { onClose: () => void }) {
  const { ingredients, ingredientById, bottles } = useBar()
  const toast = useToast()
  const [step, setStep] = useState<Step>({ kind: 'pick' })

  async function handleBarcode(barcode: string) {
    setStep({ kind: 'lookup', barcode })
    try {
      const product = await lookupProduct(barcode)
      if (!product) return setStep({ kind: 'unknown', barcode })
      const match = matchProduct(product, ingredients)
      const image = product.imageUrl ? ((await cutoutBottle(product.imageUrl).catch(() => null)) ?? undefined) : undefined
      if (match.ingredientId && ingredientById.has(match.ingredientId)) {
        const label = productLabel(product)
        const bottleId = await addBottle(match.ingredientId, { label, abv: product.abv, image, barcode })
        toast(`${label || ingredientById.get(match.ingredientId)!.name} rejoint le bar !`)
        setStep({ kind: 'added', bottleId })
      } else {
        setStep({ kind: 'unknown', barcode, product, match, image })
      }
    } catch {
      setStep({ kind: 'error', barcode, message: 'Recherche impossible : vérifie ta connexion internet.' })
    }
  }

  const title = step.kind === 'scan' ? 'Scanner une bouteille' : step.kind === 'added' ? 'Bouteille ajoutée' : 'Ajouter une bouteille'

  return (
    <Sheet title={title} onClose={onClose}>
      {step.kind === 'pick' && (
        <>
          <button className="btn teal block" onClick={() => setStep({ kind: 'scan' })}>
            <BarcodeIcon /> Scanner un code-barres
          </button>
          <IngredientList
            onSelect={(ingredientId) => setStep({ kind: 'details', ingredientId })}
            groups={BOTTLE_GROUPS}
            allowCreate
            createLabel="Pas dans la liste ? Ajouter une autre bouteille"
            placeholder="Rhum, tonic, Campari…"
          />
        </>
      )}

      {step.kind === 'details' && ingredientById.has(step.ingredientId) && (
        <>
          <BottleForm
            key={step.ingredientId}
            initial={{ ingredientId: step.ingredientId }}
            submitLabel="Ajouter au bar"
            onSubmit={async ({ ingredientId, ...details }) => {
              await addBottle(ingredientId, { ...details, barcode: step.barcode })
              toast(`${details.label.trim() || ingredientById.get(ingredientId)?.name} rejoint le bar !`)
              setStep({ kind: 'pick' })
            }}
          />
          <button className="btn ghost block" onClick={() => setStep({ kind: 'pick' })}>
            Choisir un autre type
          </button>
        </>
      )}

      {step.kind === 'scan' && <BarcodeScanner onDetected={handleBarcode} onCancel={() => setStep({ kind: 'pick' })} />}

      {step.kind === 'lookup' && (
        <div className="card empty">
          <span className="spinner" aria-hidden="true" />
          <p>
            Recherche du produit…
            <br />
            <small className="muted">Code {step.barcode}</small>
          </p>
        </div>
      )}

      {step.kind === 'error' && (
        <div className="card stack">
          <p className="error">{step.message}</p>
          <button className="btn pink block" onClick={() => handleBarcode(step.barcode)}>
            Réessayer
          </button>
          <button className="btn ghost block" onClick={() => setStep({ kind: 'pick' })}>
            Ajouter à la main
          </button>
        </div>
      )}

      {step.kind === 'unknown' && (
        <UnknownProduct
          step={step}
          onChoose={async (ingredientId) => {
            if (!step.product) return setStep({ kind: 'details', ingredientId, barcode: step.barcode })
            const label = productLabel(step.product)
            const bottleId = await addBottle(ingredientId, {
              label,
              abv: step.product.abv,
              image: step.image,
              barcode: step.barcode,
            })
            toast(`${label} rejoint le bar !`)
            setStep({ kind: 'added', bottleId })
          }}
          onCancel={() => setStep({ kind: 'pick' })}
        />
      )}

      {step.kind === 'added' &&
        (() => {
          const bottle = bottles.find((b) => b.id === step.bottleId)
          if (!bottle) return null
          return (
            <>
              <p className="muted" style={{ margin: 0 }}>
                Vérifie les informations trouvées et corrige-les si besoin.
              </p>
              <BottleForm
                key={bottle.id}
                initial={bottle}
                submitLabel="Enregistrer les modifications"
                onSubmit={async (values) => {
                  await updateBottle(bottle.id!, values)
                  toast('Modifications enregistrées')
                }}
              />
              <button className="btn teal block" onClick={() => setStep({ kind: 'scan' })}>
                <BarcodeIcon /> Scanner une autre bouteille
              </button>
              <div className="row">
                <button
                  className="btn ghost"
                  style={{ flex: 1 }}
                  onClick={async () => {
                    await removeBottle(bottle.id!)
                    toast('Ajout annulé')
                    setStep({ kind: 'pick' })
                  }}
                >
                  Annuler l'ajout
                </button>
                <button className="btn ghost" style={{ flex: 1 }} onClick={onClose}>
                  Terminé
                </button>
              </div>
            </>
          )
        })()}
    </Sheet>
  )
}

function UnknownProduct({
  step,
  onChoose,
  onCancel,
}: {
  step: Extract<Step, { kind: 'unknown' }>
  onChoose: (ingredientId: string) => void
  onCancel: () => void
}) {
  const { product, match, image } = step
  return (
    <>
      <div className="card row bottle-head">
        {image && <img className="bottle-photo" src={image} alt="" style={{ height: 80, maxWidth: 72 }} />}
        <div className="grow">
          {product ? (
            <>
              <strong>{productLabel(product)}</strong>
              {product.abv && <div className="muted">{String(product.abv).replace('.', ',')} %</div>}
              <p style={{ margin: '6px 0 0' }}>Je n'ai pas reconnu le type de bouteille : choisis-le ci-dessous.</p>
            </>
          ) : (
            <>
              <strong>Produit introuvable</strong>
              <p style={{ margin: '6px 0 0' }}>
                Le code {step.barcode} n'est pas dans Open Food Facts. Choisis le type, tu compléteras le nom ensuite.
              </p>
            </>
          )}
        </div>
      </div>
      <IngredientList
        groups={BOTTLE_GROUPS}
        allowCreate
        createLabel={match ? `Créer « ${match.suggestedName} »` : 'Pas dans la liste ? Ajouter un autre type'}
        createDefaults={match ? { name: match.suggestedName, group: match.group } : undefined}
        onSelect={onChoose}
      />
      <button className="btn ghost block" onClick={onCancel}>
        Annuler
      </button>
    </>
  )
}
