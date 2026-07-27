/**
 * Subcategories within the Classical genre. Each maps to a Jamendo AND-tag
 * query (`tags=classical <tag>`) — combos were verified to return results;
 * e.g. cello/choral/strings return zero on Jamendo and are omitted.
 * The slugs also tag the curated archive.org collections (see
 * services/archive/api.ts) so the Masterworks section filters along with them.
 */
export interface ClassicalSubcategory {
  slug: string
  label: string
  /** Extra Jamendo tag AND-ed with 'classical' */
  tag: string
}

export const classicalSubcategories: ClassicalSubcategory[] = [
  { slug: 'piano', label: 'Piano', tag: 'piano' },
  { slug: 'violin', label: 'Violin', tag: 'violin' },
  { slug: 'guitar', label: 'Guitar', tag: 'guitar' },
  { slug: 'flute', label: 'Flute', tag: 'flute' },
  { slug: 'harp', label: 'Harp', tag: 'harp' },
  { slug: 'orchestra', label: 'Orchestra', tag: 'orchestra' },
  { slug: 'symphony', label: 'Symphony', tag: 'symphony' },
  { slug: 'chamber', label: 'Chamber', tag: 'chamber' },
  { slug: 'opera', label: 'Opera', tag: 'opera' },
]

export function findClassicalSubcategory(slug: string): ClassicalSubcategory | undefined {
  return classicalSubcategories.find((s) => s.slug === slug)
}
