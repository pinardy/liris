import { useCallback, useState, type ReactNode } from 'react'
import ConfirmDialog, { type ConfirmRequest } from '../components/common/ConfirmDialog'

/**
 * Call-site helper for the confirm dialog:
 *   const { confirm, confirmDialog } = useConfirm()
 * render `{confirmDialog}` once, then call `confirm({...})` from a handler.
 */
export function useConfirm(): {
  confirm: (request: ConfirmRequest) => void
  confirmDialog: ReactNode
} {
  const [pending, setPending] = useState<ConfirmRequest | null>(null)
  const confirm = useCallback((request: ConfirmRequest) => setPending(request), [])
  return {
    confirm,
    confirmDialog: pending ? (
      <ConfirmDialog {...pending} onClose={() => setPending(null)} />
    ) : null,
  }
}
