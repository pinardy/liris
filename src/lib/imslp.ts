/**
 * IMSLP (the Petrucci Music Library) hosts public-domain scores — the sheet-
 * music counterpart to this catalog's public-domain recordings. Search URLs
 * are used rather than guessed page titles: IMSLP page naming ('Symphonie
 * No.5, Op.67 (Beethoven, Ludwig van)') is too irregular to construct
 * reliably, while search with work title + composer lands on or beside the
 * right page.
 */
export function imslpSearchUrl(query: string): string {
  const params = new URLSearchParams({ search: query, title: 'Special:Search' })
  return `https://imslp.org/index.php?${params}`
}
