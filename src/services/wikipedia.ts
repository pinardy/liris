/**
 * Wikipedia summaries for composers and works. Both endpoints send CORS
 * headers and are cached by the service worker, so blurbs work offline after
 * a first visit. Every function resolves to null rather than throwing —
 * enrichment must never break a page.
 */

const SUMMARY_URL = 'https://en.wikipedia.org/api/rest_v1/page/summary/'
const SEARCH_URL = 'https://en.wikipedia.org/w/rest.php/v1/search/title'

export interface WikiSummary {
  title: string
  extract: string
  /** Canonical article URL for attribution. */
  url?: string
  /** Lead image (~320px wide) — portrait fallback for composers. */
  thumbnail?: string
}

interface SummaryResponse {
  type?: string
  title?: string
  extract?: string
  content_urls?: { desktop?: { page?: string } }
  thumbnail?: { source?: string }
}

/** Summary of the article with (almost) exactly this title; follows redirects. */
export async function fetchSummary(title: string): Promise<WikiSummary | null> {
  try {
    const res = await fetch(`${SUMMARY_URL}${encodeURIComponent(title)}?redirect=true`)
    if (!res.ok) return null
    const data = (await res.json()) as SummaryResponse
    if (!data.extract || data.type === 'disambiguation') return null
    return {
      title: data.title ?? title,
      extract: data.extract,
      url: data.content_urls?.desktop?.page,
      thumbnail: data.thumbnail?.source,
    }
  } catch {
    return null
  }
}

/**
 * Look a topic up via title search, then summarise the best hit. Work titles
 * rarely match article titles exactly ('Symphony No. 5 in C Minor, Op. 67' vs
 * 'Symphony No. 5 (Beethoven)'), so search bridges the gap. `mustMention`
 * guards against a confidently wrong top hit: the summary is discarded unless
 * it mentions the given string (in practice, the composer's surname).
 */
export async function searchSummary(
  query: string,
  mustMention?: string,
): Promise<WikiSummary | null> {
  try {
    const params = new URLSearchParams({ q: query, limit: '1' })
    const res = await fetch(`${SEARCH_URL}?${params}`)
    if (!res.ok) return null
    const data = (await res.json()) as { pages?: { key?: string }[] }
    const key = data.pages?.[0]?.key
    if (!key) return null
    const summary = await fetchSummary(key)
    if (!summary) return null
    if (
      mustMention &&
      !`${summary.title} ${summary.extract}`
        .toLowerCase()
        .includes(mustMention.toLowerCase())
    ) {
      return null
    }
    return summary
  } catch {
    return null
  }
}
