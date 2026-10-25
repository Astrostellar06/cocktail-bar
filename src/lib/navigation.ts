import { useNavigate } from 'react-router'

/** Retour arrière ; si l'on est arrivé directement sur la page (pas d'historique), va vers `fallback`. */
export function useGoBack(fallback: string) {
  const navigate = useNavigate()
  return () => (window.history.state?.idx > 0 ? navigate(-1) : navigate(fallback, { replace: true }))
}
