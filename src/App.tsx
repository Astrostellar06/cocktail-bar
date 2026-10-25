import { createHashRouter, Navigate, Outlet, ScrollRestoration, useMatch } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { TabBar } from './components/TabBar'
import { BarPage } from './pages/bar/BarPage'
import { CocktailDetailPage } from './pages/cocktails/CocktailDetailPage'
import { CocktailEditorPage } from './pages/cocktails/CocktailEditorPage'
import { CocktailsPage } from './pages/cocktails/CocktailsPage'
import { SettingsPage } from './pages/SettingsPage'

function Layout() {
  const creating = useMatch('/cocktails/nouveau')
  const editing = useMatch('/cocktails/:id/modifier')
  return (
    <div className="app">
      <Outlet />
      {!creating && !editing && <TabBar />}
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
