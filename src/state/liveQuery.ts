import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'

export function usePageVisible(): boolean {
  const [visible, setVisible] = useState(() => document.visibilityState !== 'hidden')
  useEffect(() => {
    const onChange = () => setVisible(document.visibilityState !== 'hidden')
    document.addEventListener('visibilitychange', onChange)
    return () => document.removeEventListener('visibilitychange', onChange)
  }, [])
  return visible
}

/**
 * `useLiveQuery` qui ne lit plus la base tant que la page est cachée : il renvoie alors la dernière valeur connue.
 *
 * Sans cela, une page en arrière-plan (onglet Chrome à côté de l'app installée) relit la base à chaque écriture
 * faite ailleurs ; si Android la met en pause au milieu de cette lecture, la table reste verrouillée et toutes les
 * écritures suivantes restent bloquées. La lecture reprend dès que la page redevient visible.
 */
export function usePausableLiveQuery<T>(querier: () => Promise<T>, active: boolean): T | undefined {
  const [last, setLast] = useState<T | undefined>(undefined)
  // En pause, la requête ne touche pas la base : liveQuery n'a alors rien à surveiller et ne se relance plus.
  const result = useLiveQuery<T | typeof PAUSED>(() => (active ? querier() : PAUSED), [active])
  const fresh = result === undefined || result === PAUSED ? undefined : result
  if (fresh !== undefined && fresh !== last) setLast(fresh)
  return fresh ?? last
}

const PAUSED = Symbol('pause')
