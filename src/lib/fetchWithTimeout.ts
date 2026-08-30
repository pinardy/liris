/**
 * fetch() has no timeout of its own: a request to a stalled host can hang
 * until the browser gives up, which for the user is a spinner that never
 * resolves and has no cancel. Everything reaching a third-party API goes
 * through here so a dead endpoint fails in seconds with a real message.
 */

export const DEFAULT_TIMEOUT_MS = 15_000

export class TimeoutError extends Error {
  constructor(message = 'The request took too long — the service may be down') {
    super(message)
    this.name = 'TimeoutError'
  }
}

export async function fetchWithTimeout(
  input: string | URL,
  init: RequestInit = {},
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  // A caller-supplied signal still wins: chain it to ours.
  init.signal?.addEventListener('abort', () => controller.abort(), { once: true })
  try {
    return await fetch(input, { ...init, signal: controller.signal })
  } catch (err) {
    // Distinguish our timeout from a caller's cancellation and from a genuine
    // network failure, so the UI can say which happened.
    if (err instanceof DOMException && err.name === 'AbortError') {
      if (init.signal?.aborted) throw err
      throw new TimeoutError()
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}
