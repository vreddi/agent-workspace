import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@org/ui/components/alert-dialog'
import { useCallback, useRef, useState, type ReactNode } from 'react'

export type ConfirmOptions = {
  title: string
  description?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  /** Style the confirm button as a destructive action (red). */
  destructive?: boolean
}

/**
 * Promise-based replacement for `window.confirm`. Render `confirmDialog`
 * somewhere in the component tree, then `await confirm({ ... })` to prompt —
 * it resolves `true` when confirmed, `false` when cancelled or dismissed.
 */
export function useConfirm() {
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const resolverRef = useRef<((value: boolean) => void) | null>(null)

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts)
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve
    })
  }, [])

  const settle = useCallback((value: boolean) => {
    resolverRef.current?.(value)
    resolverRef.current = null
    setOptions(null)
  }, [])

  const confirmDialog = (
    <AlertDialog
      open={options !== null}
      onOpenChange={(open) => {
        // Escape / overlay dismissal resolves as "cancelled".
        if (!open) settle(false)
      }}
    >
      {options && (
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{options.title}</AlertDialogTitle>
            {options.description != null && (
              <AlertDialogDescription>
                {options.description}
              </AlertDialogDescription>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => settle(false)}>
              {options.cancelLabel ?? 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              variant={options.destructive ? 'destructive' : 'default'}
              onClick={() => settle(true)}
            >
              {options.confirmLabel ?? 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      )}
    </AlertDialog>
  )

  return { confirm, confirmDialog }
}
