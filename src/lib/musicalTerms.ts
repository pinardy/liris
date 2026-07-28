/**
 * A small bundled glossary of the Italian (and French/Latin) terms that appear
 * in movement titles — tempo marks, expression, dance forms. Entries are
 * atomic on purpose: 'Allegro ma non troppo' should surface 'allegro' and
 * 'ma non troppo' as two separately useful chips rather than needing every
 * compound spelled out.
 */

export interface MusicalTerm {
  term: string
  definition: string
}

export const musicalTerms: MusicalTerm[] = [
  // --- tempo, slow to fast ---
  { term: 'grave', definition: 'Very slow and solemn — the weightiest tempo mark.' },
  { term: 'largo', definition: 'Very slow and broad.' },
  { term: 'larghetto', definition: 'Fairly slow — a little lighter than largo.' },
  { term: 'lento', definition: 'Slow.' },
  { term: 'adagio', definition: 'Slow and unhurried; literally "at ease".' },
  { term: 'adagietto', definition: 'Slightly faster (and lighter) than adagio.' },
  { term: 'andante', definition: 'At an easy walking pace.' },
  { term: 'andantino', definition: 'A shade faster than andante (historically ambiguous!).' },
  { term: 'moderato', definition: 'At a moderate speed.' },
  { term: 'allegretto', definition: 'Moderately fast — allegro with less drive.' },
  { term: 'allegro', definition: 'Fast and lively; literally "cheerful".' },
  { term: 'vivace', definition: 'Brisk and full of life, faster than allegro.' },
  { term: 'vivo', definition: 'Lively, vivid.' },
  { term: 'presto', definition: 'Very fast.' },
  { term: 'prestissimo', definition: 'As fast as possible.' },

  // --- tempo modifiers ---
  { term: 'molto', definition: '"Very" — intensifies whatever it modifies.' },
  { term: 'assai', definition: '"Very" — allegro assai is very fast.' },
  { term: 'ma non troppo', definition: '"But not too much" — reins in the main marking.' },
  { term: 'non troppo', definition: '"Not too much".' },
  { term: 'meno', definition: '"Less" — meno mosso means less movement, slower.' },
  { term: 'più', definition: '"More" — più mosso means more movement, faster.' },
  { term: 'un poco', definition: '"A little".' },
  { term: 'poco', definition: '"A little" — poco allegro is slightly fast.' },
  { term: 'mosso', definition: 'With motion; appears as meno/più mosso.' },
  { term: 'con moto', definition: 'With movement — keep it flowing.' },
  { term: 'sostenuto', definition: 'Sustained, holding the sound (and often the tempo) back.' },
  { term: 'quasi', definition: '"As if, almost" — andante quasi allegretto.' },
  { term: 'rubato', definition: 'Flexible timing — stealing time from one beat to repay another.' },
  { term: "l'istesso tempo", definition: 'Keep the same tempo despite a change of meter.' },
  { term: 'tempo giusto', definition: 'In strict, exact time.' },
  { term: 'a tempo', definition: 'Return to the main tempo.' },

  // --- character & expression ---
  { term: 'cantabile', definition: 'In a singing style.' },
  { term: 'dolce', definition: 'Sweetly, gently.' },
  { term: 'espressivo', definition: 'Expressively.' },
  { term: 'grazioso', definition: 'Gracefully.' },
  { term: 'maestoso', definition: 'Majestically, with dignity.' },
  { term: 'tranquillo', definition: 'Calm, tranquil.' },
  { term: 'agitato', definition: 'Agitated, restless.' },
  { term: 'appassionato', definition: 'Passionately.' },
  { term: 'giocoso', definition: 'Playful, joking.' },
  { term: 'scherzando', definition: 'Playfully, jokingly.' },
  { term: 'energico', definition: 'Energetically.' },
  { term: 'risoluto', definition: 'Resolute, decisive.' },
  { term: 'leggiero', definition: 'Light and nimble.' },
  { term: 'marcato', definition: 'Each note marked, emphasised.' },
  { term: 'animato', definition: 'Animated, spirited.' },
  { term: 'brillante', definition: 'Brilliant, sparkling.' },
  { term: 'misterioso', definition: 'Mysteriously.' },
  { term: 'lamentoso', definition: 'Mournful, lamenting.' },
  { term: 'capriccioso', definition: 'Capricious, whimsical.' },
  { term: 'con brio', definition: 'With vigour and spirit.' },
  { term: 'con fuoco', definition: 'With fire.' },
  { term: 'con spirito', definition: 'With spirit.' },
  { term: 'con anima', definition: 'With soul (or: with animation).' },
  { term: 'con grazia', definition: 'With grace.' },
  { term: 'sotto voce', definition: 'In an undertone, hushed.' },
  { term: 'alla marcia', definition: 'In the style of a march.' },
  { term: 'alla turca', definition: 'In the "Turkish" style — imitating Janissary band music.' },
  { term: 'funebre', definition: 'Funereal — marcia funebre is a funeral march.' },
  { term: 'pastorale', definition: 'Evoking shepherds and the countryside.' },

  // --- performance directions & technique ---
  { term: 'pizzicato', definition: 'Strings plucked with the fingers instead of bowed.' },
  { term: 'arco', definition: 'Return to the bow after pizzicato.' },
  { term: 'legato', definition: 'Smoothly connected notes.' },
  { term: 'staccato', definition: 'Short, detached notes.' },
  { term: 'tremolo', definition: 'A rapid trembling repetition of a note.' },
  { term: 'con sordino', definition: 'With the mute.' },
  { term: 'ostinato', definition: 'A short pattern repeated insistently underneath the music.' },
  { term: 'cadenza', definition: 'A virtuosic solo passage, traditionally improvised, near the end of a movement.' },
  { term: 'tutti', definition: 'Everyone plays — the full ensemble, after a solo.' },
  { term: 'obbligato', definition: 'An essential (not optional) accompanying solo line.' },
  { term: 'da capo', definition: '"From the top" — repeat from the beginning.' },
  { term: 'attacca', definition: 'Go straight into the next movement without a pause.' },
  { term: 'coda', definition: 'A concluding section that rounds a movement off.' },

  // --- movements, forms & genres ---
  { term: 'aria', definition: 'A song-like piece, originally for voice in opera or oratorio.' },
  { term: 'arioso', definition: 'Between recitative and full aria — speech-like but melodic.' },
  { term: 'recitativo', definition: 'Sung speech that carries the story between arias.' },
  { term: 'overture', definition: 'An orchestral opener, for an opera or on its own.' },
  { term: 'prelude', definition: 'An introductory piece — or a free-standing short work.' },
  { term: 'fugue', definition: 'A theme chased through interweaving voices in strict counterpoint.' },
  { term: 'fuga', definition: 'Fugue: a theme chased through interweaving voices.' },
  { term: 'toccata', definition: 'A virtuosic "touch piece" showing off the player\'s fingers.' },
  { term: 'fantasia', definition: 'A free-form piece, as if improvised.' },
  { term: 'impromptu', definition: 'A short piece with an air of improvisation.' },
  { term: 'nocturne', definition: 'A dreamy "night piece", typically for piano.' },
  { term: 'étude', definition: 'A study built on one technical challenge — often concert-worthy anyway.' },
  { term: 'ballade', definition: 'A dramatic, narrative piano piece (in Chopin\'s sense).' },
  { term: 'barcarolle', definition: 'A Venetian gondolier\'s song, rocking in 6/8.' },
  { term: 'berceuse', definition: 'A lullaby.' },
  { term: 'mazurka', definition: 'A Polish dance in triple time with off-beat accents.' },
  { term: 'polonaise', definition: 'A stately Polish processional dance.' },
  { term: 'valse', definition: 'Waltz — a turning dance in triple time.' },
  { term: 'serenade', definition: 'Light, sociable evening music.' },
  { term: 'divertimento', definition: 'Light multi-movement entertainment music.' },
  { term: 'sinfonia', definition: 'An Italian overture or short symphony; in Bach, a three-part invention.' },
  { term: 'intermezzo', definition: 'An "in-between" piece — later, a short lyrical character piece.' },
  { term: 'capriccio', definition: 'A lively piece that follows its own whim.' },
  { term: 'scherzo', definition: 'A quick, playful movement — literally "joke" — usually with a contrasting trio.' },
  { term: 'menuetto', definition: 'Minuet: an elegant courtly dance in triple time.' },
  { term: 'minuet', definition: 'An elegant courtly dance in triple time.' },
  { term: 'trio', definition: 'The contrasting middle section of a minuet or scherzo (once played by three instruments).' },
  { term: 'rondo', definition: 'A refrain that keeps returning between contrasting episodes.' },
  { term: 'finale', definition: 'The closing movement.' },
  { term: 'chaconne', definition: 'Continuous variations over a repeating bass or harmonic pattern.' },
  { term: 'passacaglia', definition: 'Variations unfolding over a repeating bass line.' },
  { term: 'allemande', definition: 'A moderate German dance — often a suite\'s first dance.' },
  { term: 'courante', definition: 'A flowing "running" dance.' },
  { term: 'sarabande', definition: 'A slow, grave dance in triple time, weighted on the second beat.' },
  { term: 'gigue', definition: 'A fast, leaping dance that typically ends a suite.' },
  { term: 'gavotte', definition: 'A moderate dance beginning mid-bar.' },
  { term: 'bourrée', definition: 'A quick French dance with an upbeat.' },
  { term: 'requiem', definition: 'A mass for the dead.' },
  { term: 'kyrie', definition: '"Lord, have mercy" — the opening movement of the mass.' },
  { term: 'gloria', definition: 'The mass\'s hymn of praise.' },
  { term: 'credo', definition: 'The creed — the mass\'s statement of faith.' },
  { term: 'sanctus', definition: '"Holy, holy, holy" — sung at the heart of the mass.' },
  { term: 'agnus dei', definition: '"Lamb of God" — the closing prayer of the mass.' },
  { term: 'magnificat', definition: 'Mary\'s canticle of praise, from Luke, in festive setting.' },
  { term: 'cantata', definition: 'A multi-movement vocal work — sung, where a sonata is played.' },
  { term: 'oratorio', definition: 'A dramatic sacred story for voices and orchestra, unstaged.' },
  { term: 'motet', definition: 'A polyphonic sacred choral piece.' },
  { term: 'canon', definition: 'Voices entering one after another with the same melody, exactly imitated.' },
]

/** Lowercase and strip diacritics: 'Bourrée' matches 'bourree' and vice versa. */
function fold(s: string): string {
  return s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

/**
 * Terms appearing in any of the given texts, in glossary order (slow→fast for
 * tempo marks, then by category). Word-bounded so 'aria' never fires inside
 * 'variations'; spaces in multi-word terms also match hyphens.
 */
export function findTerms(texts: string[]): MusicalTerm[] {
  const hay = fold(texts.join('\n'))
  return musicalTerms.filter((t) => {
    const pattern = fold(t.term)
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      .replace(/ /g, '[\\s-]+')
    return new RegExp(`(?<![a-z])${pattern}(?![a-z])`).test(hay)
  })
}
