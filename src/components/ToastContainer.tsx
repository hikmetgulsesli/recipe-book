import type { Toast } from '../hooks/useToast'
import './ToastContainer.css'

export interface ToastContainerProps {
  toasts: Toast[]
  onRemove: (id: string) => void
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null

  return (
    <div 
      className="toast-container" 
      role="region" 
      aria-live="polite" 
      aria-label="Notifications"
    >
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          className={`toast toast--${toast.type}`}
          style={{ '--toast-index': index } as React.CSSProperties}
          role="alert"
        >
          <div className="toast__content">
            <span className="toast__message">{toast.message}</span>
          </div>
          <button
            onClick={() => onRemove(toast.id)}
            className="toast__close"
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
