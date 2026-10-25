import { useLayoutEffect, useRef, useState } from 'react'
import { createHashRouter, Navigate, Outlet, ScrollRestoration, useLocation, useNavigate } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { TabBar } from './components/TabBar'
import { useTabSwipe } from './lib/useTabSwipe'
import { BarPage } from './pages/bar/BarPage'
import { CocktailDetailPage } from './pages/cocktails/CocktailDetailPage'
import { CocktailEditorPage } from './pages/cocktails/CocktailEditorPage'
import { CocktailsPage } from './pages/cocktails/CocktailsPage'
import { SettingsPage } from './pages/SettingsPage'

function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const appRef = useRef<HTMLDivElement>(null)
  const pageRef = useRef<HTMLDivElement>(null)

  // Onglet courant : « Mon bar » (et ses réglages) ou « Cocktails » (liste, fiches, éditeur).
  const section = location.pathname.startsWith('/cocktails') ? 1 : 0
  const editing = location.pathname === '/cocktails/nouveau' || location.pathname.endsWith('/modifier')

  // Revenir sur « Cocktails » retrouve les filtres laissés en partant.
  const [cocktailsHref, setCocktailsHref] = useState('/cocktails')
  const currentList = location.pathname === '/cocktails' ? `/cocktails${location.search}` : null
  if (currentList && currentList !== cocktailsHref) setCocktailsHref(currentList)

  // Sens de l'animation : la page arrive du côté de son onglet.
  const [previousSection, setPreviousSection] = useState(section)
  const [enterFrom, setEnterFrom] = useState<'' | 'from-right' | 'from-left'>('')
  if (previousSection !== section) {
    setPreviousSection(section)
    setEnterFrom(section > previousSection ? 'from-right' : 'from-left')
  }

  // L'indicateur de la barre d'onglets a suivi le geste jusqu'au nouvel onglet : on remet le décalage à zéro.
  useLayoutEffect(() => {
    appRef.current?.style.setProperty('--swipe', '0')
  }, [section])

  useTabSwipe(pageRef, {
    enabled: location.pathname === '/' || location.pathname === '/cocktails',
    section,
    onSwitch: (to) => navigate(to === 1 ? cocktailsHref : '/'),
  })

  return (
    <div className="app" ref={appRef}>
      <div key={section} ref={pageRef} className={`tab-page ${enterFrom}`}>
        <Outlet />
      </div>
      {!editing && <TabBar section={section} cocktailsHref={cocktailsHref} />}
      <ScrollRestoration />
    </div>
  )
}

// Routage par « # » : fonctionne sur n'importe quel hébergement statique, sans configuration serveur.
const router = createHashRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <BarPage /> },
      { path: 'cocktails', element: <CocktailsPage /> },
      { path: 'cocktails/nouveau', element: <CocktailEditorPage /> },
      { path: 'cocktails/:id', element: <CocktailDetailPage /> },
      { path: 'cocktails/:id/modifier', element: <CocktailEditorPage /> },
      { path: 'reglages', element: <SettingsPage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])

export function App() {
  return <RouterProvider router={router} />
}
