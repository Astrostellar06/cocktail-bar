import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

export interface ConfirmOptions {
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  /** Action destructrice : bouton rouge. */
  danger?: boolean
  /** Simple information : un seul bouton. */
  alertOnly?: boolean
}

type Confirm = (options: ConfirmOptions) => Promise<boolean>

const DialogContext = createContext<Confirm>(async () => false)

/** Remplace `window.confirm` / `window.alert` par une fenêtre dans le style de l'app. */
export function DialogProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<(ConfirmOptions & { resolve: (ok: boolean) => void }) | null>(null)

  const confirm = useCallback<Confirm>(
    (options) =>
      new Promise((resolve) => {
        setDialog({ ...options, resolve })
      }),
    [],
  )

  const close = (ok: boolean) => {
    dialog?.resolve(ok)
    setDialog(null)
  }

  return (
    <DialogContext.Provider value={confirm}>
      {children}
      {dialog && <ConfirmDialog options={dialog} onClose={close} />}
    </DialogContext.Provider>
  )
}

function ConfirmDialog({ options, onClose }: { options: ConfirmOptions; onClose: (ok: boolean) => void }) {
  const confirmButton = useRef<HTMLButtonElement>(null)
  const { title, message, confirmLabel = 'Confirmer', cancelLabel = 'Annuler', danger, alertOnly } = options

  useEffect(() => {
    confirmButton.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <div className="dialog-backdrop" onClick={(e) => e.target === e.currentTarget && onClose(false)}>
      <div className="dialog" role="alertdialog" aria-modal="true" aria-labelledby="dialog-title">
        <h2 id="dialog-title">{title}</h2>
        {message && <p>{message}</p>}
        <div className="dialog-actions">
          {!alertOnly && (
            <button className="btn ghost" onClick={() => onClose(false)}>
              {cancelLabel}
            </button>
          )}
          <button ref={confirmButton} className={`btn ${danger ? 'danger' : 'pink'}`} onClick={() => onClose(true)}>
            {alertOnly ? 'OK' : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export const useConfirm = () => useContext(DialogContext)
