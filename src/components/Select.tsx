import { useState } from 'react'
import { CheckIcon, ChevronDownIcon } from './icons'
import { Sheet } from './Sheet'

export interface SelectOption<T extends string> {
  value: T
  label: string
}

interface Props<T extends string> {
  value: T
  options: SelectOption<T>[]
  onChange: (value: T) => void
  /** Titre du panneau de choix. */
  title: string
  small?: boolean
  className?: string
}

/** Liste déroulante dans le style de l'app : ouvre un panneau au lieu de la boîte de dialogue du système. */
export function Select<T extends string>({ value, options, onChange, title, small, className = '' }: Props<T>) {
  const [open, setOpen] = useState(false)
  const current = options.find((o) => o.value === value)

  return (
    <>
      <button
        type="button"
        className={`select select-button${small ? ' sm' : ''} ${className}`}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        <span>{current?.label ?? '—'}</span>
        <ChevronDownIcon size={16} />
      </button>
      {open && (
        <Sheet title={title} onClose={() => setOpen(false)}>
          <div className="picker-list" role="listbox" aria-label={title}>
            {options.map((o) => (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={o.value === value}
                className={`picker-item${o.value === value ? ' selected' : ''}`}
                onClick={() => {
                  onChange(o.value)
                  setOpen(false)
                }}
              >
                <span className="name">{o.label}</span>
                {o.value === value && <CheckIcon size={18} />}
              </button>
            ))}
          </div>
        </Sheet>
      )}
    </>
  )
}
