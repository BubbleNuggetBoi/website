import { useEffect, useRef } from 'react'

/**
 * Tracks nested dialogs (edit form + delete confirmation) so Escape only ever
 * closes the topmost one.
 */
const modalStack = []

/**
 * Shared dialog shell: backdrop click, Escape to close, scroll lock and simple
 * focus containment. Renders as a centered panel on desktop and a bottom sheet
 * on phones (see CSS), which keeps controls within thumb reach in the warehouse.
 */
export default function Modal({ title, subtitle, onClose, children, footer, size = 'md' }) {
  const panelRef = useRef(null)
  const tokenRef = useRef({})

  useEffect(() => {
    const token = tokenRef.current
    modalStack.push(token)

    const isTopmost = () => modalStack[modalStack.length - 1] === token

    const onKeyDown = (event) => {
      if (!isTopmost()) return
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab' || !panelRef.current) return

      const focusable = panelRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const firstField = panelRef.current?.querySelector(
      'input, select, textarea, button:not(.modal__close)',
    )
    firstField?.focus({ preventScroll: true })

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      const index = modalStack.indexOf(token)
      if (index !== -1) modalStack.splice(index, 1)
    }
  }, [onClose])

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        className={`modal modal--${size}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        ref={panelRef}
      >
        <header className="modal__head">
          <div>
            <h2 className="modal__title">{title}</h2>
            {subtitle ? <p className="modal__subtitle">{subtitle}</p> : null}
          </div>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M6 6l12 12M18 6L6 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </header>

        <div className="modal__body">{children}</div>

        {footer ? <footer className="modal__foot">{footer}</footer> : null}
      </div>
    </div>
  )
}
