// Minimal typings for the Launch Handler API (window.launchQueue), which the
// PWA uses to receive files opened via the OS "Open with…" flow. Not yet in
// the standard DOM lib.
interface LaunchParams {
  readonly files: readonly FileSystemFileHandle[]
  readonly targetURL?: string
}

interface LaunchQueue {
  setConsumer(consumer: (params: LaunchParams) => void): void
}

interface Window {
  launchQueue?: LaunchQueue
}
