import type { CSSProperties } from 'react'
import { Link } from 'react-router'
import { BottleTabIcon, GlassTabIcon } from './icons'

/** Barre d'onglets ; la pastille jaune glisse vers l'onglet actif (et suit le doigt pendant un balayage). */
export function TabBar({ section, cocktailsHref }: { section: 0 | 1; cocktailsHref: string }) {
  return (
    <div className="tabbar">
      <nav aria-label="Navigation principale" style={{ '--tab': section } as CSSProperties}>
        <span className="tab-indicator" aria-hidden="true" />
        <Link to="/" className={section === 0 ? 'active' : undefined} aria-current={section === 0 ? 'page' : undefined}>
          <BottleTabIcon />
          Mon bar
        </Link>
        <Link
          to={cocktailsHref}
          className={section === 1 ? 'active' : undefined}
          aria-current={section === 1 ? 'page' : undefined}
        >
          <GlassTabIcon />
          Cocktails
        </Link>
      </nav>
    </div>
  )
}
