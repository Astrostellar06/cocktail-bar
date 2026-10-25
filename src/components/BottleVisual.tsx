import type { Group } from '../data/types'
import type { BottleRow } from '../lib/db'
import { BottleIcon } from './icons'

/** Photo détourée de la bouteille si elle existe, sinon l'icône du rayon. */
export function BottleVisual({ bottle, group, size }: { bottle: Pick<BottleRow, 'image'>; group: Group; size: number }) {
  if (bottle.image) {
    return <img className="bottle-photo" src={bottle.image} alt="" style={{ height: size * 1.12, maxWidth: size }} />
  }
  return <BottleIcon group={group.id} color={group.color} size={size} />
}
