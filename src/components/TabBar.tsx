import { NavLink } from 'react-router'
import { BottleTabIcon, GlassTabIcon } from './icons'

export function TabBar() {
  return (
    <div className="tabbar">
      <nav aria-label="Navigation principale">
        <NavLink to="/" end>
          <BottleTabIcon />
          Mon bar
        </NavLink>
        <NavLink to="/cocktails">
          <GlassTabIcon />
          Cocktails
        </NavLink>
      </nav>
    </div>
  )
}
