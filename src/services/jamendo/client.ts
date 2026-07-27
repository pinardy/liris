import type { JamendoEnvelope } from './types'

const BASE = 'https://api.jamendo.com/v3.0'
const CLIENT_ID = import.meta.env.VITE_JAMENDO_CLIENT_ID as string | undefined

export class JamendoError extends Error {
  readonly code?: number

  constructor(message: string, code?: number) {
    super(message)
    this.name = 'JamendoError'
    this.code = code
  }
}

export function hasClientId(): boolean {
  return Boolean(CLIENT_ID && CLIENT_ID !== 'your_client_id_here')
}

export async function jam<T>(
  path: string,
  params: Record<string, string | number> = {},
): Promise<T[]> {
  if (!hasClientId()) {
    throw new JamendoError(
      'Missing Jamendo client_id. Get a free one at devportal.jamendo.com and set VITE_JAMENDO_CLIENT_ID in .env.local.',
    )
  }
  const url = new URL(BASE + path)
  url.searchParams.set('client_id', CLIENT_ID!)
  url.searchParams.set('format', 'json')
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value))
  }
  const res = await fetch(url)
  if (!res.ok) {
    throw new JamendoError(`Jamendo request failed (HTTP ${res.status})`, res.status)
  }
  const body = (await res.json()) as JamendoEnvelope<T>
  if (body.headers.status !== 'success') {
    throw new JamendoError(
      body.headers.error_message || 'Jamendo API returned an error',
      body.headers.code,
    )
  }
  return body.results
}
