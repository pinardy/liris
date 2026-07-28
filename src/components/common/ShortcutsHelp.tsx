import { SHORTCUTS } from '../../hooks/useKeyboardShortcuts'
import Modal from './Modal'

/** Keyboard shortcuts reference, opened with '?'. */
export default function ShortcutsHelp({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Keyboard shortcuts" onClose={onClose}>
      <dl className="flex flex-col gap-1.5">
        {SHORTCUTS.map((s) => (
          <div key={s.keys} className="flex items-center justify-between gap-4">
            <dt>
              <kbd className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-xs text-zinc-200">
                {s.keys}
              </kbd>
            </dt>
            <dd className="text-sm text-zinc-400">{s.action}</dd>
          </div>
        ))}
      </dl>
    </Modal>
  )
}
