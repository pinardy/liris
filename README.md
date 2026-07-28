# Liris Classical

A free, installable classical music player built with React + TypeScript. Browse the canon the way a classical listener actually thinks about it — by **composer**, **period**, **form** and **performer**, with **works** modelled separately from the **recordings** of them. No backend, no accounts, no cost.

Live at **https://pinardy.github.io/liris/**

## Where the music comes from

**Public-domain classical recordings** from the Internet Archive, indexed into a proper classical catalog at runtime:

| Collection | Movements | Licence |
|---|---|---|
| [Musopen Collection](https://archive.org/details/MusopenCollectionAsFlac) | 145 | Public Domain Mark 1.0 |
| [The Complete Chopin Collection](https://archive.org/details/musopen-chopin) | 104 | CC0 1.0 |
| [Open Goldberg Variations](https://archive.org/details/OpenGoldbergVariations) | 31 | CC0 1.0 |
| [100 Classical Music Masterpieces](https://archive.org/details/100ClassicalMusicMasterpieces) | 100 | ⚠️ unverified |

That indexes to roughly **230 works by 34 composers**. Bach's Goldberg Variations appears with **two recordings** (Shelley Katz and Kimiko Ishizaka), which is the case the work/recording split exists for.

> **⚠️ Licence caveat.** The first three collections are explicitly public domain or CC0. The *100 Masterpieces* upload carries **no licence statement** on archive.org — the compositions are long out of copyright, but the status of those particular recordings is unverified, and the app labels it as such on its collection page. To be strictly clean, drop it from `classicalCollections` in `src/services/archive/api.ts`; the catalog falls to ~280 movements.
>
> Deliberately excluded: archive.org's `unlockedrecordings` / `album_recordings` LP rips. They have far better metadata but carry no licence and are digitised commercial records.

**Composer portraits** come from Wikimedia Commons — public-domain paintings and photographs, referenced by `Special:FilePath` so Commons resizes them server-side and no API call or hashed URL is needed. The map lives in `src/lib/composers.ts`; composers without one (Pachelbel, of whom no authenticated likeness survives) fall back to initials.

**Two secondary strands:** a *Contemporary* section (living independent composers via Jamendo's Creative Commons catalog) and **your own files** — import MP3/FLAC/M4A/OGG, stored in the browser and played fully offline.

## How the classical model works

The interesting part is `src/services/archive/`. Each source collection labels its files differently, so each gets its own reader in `parse.ts`:

- **Musopen** — `Composer - Work - NN - Movement`, though the movement number's position varies; the performing ensemble is a separate field.
- **Chopin** — titles live only in filenames; the whole set is one composer.
- **Open Goldberg** — the work is in the album field, each file is a variation.
- **100 Masterpieces** — mixed conventions (`YEAR Composer / Work`, `YEAR Composer- Work`, or no composer at all), so the composer is found by scanning filenames against the composer table, with a curated fallback for a handful of unattributed Mozart pieces.

`classicalIndex.ts` then groups parsed rows into works, and works into recordings (one per source collection). Work identity is a slug of composer + title, which is what lets `Goldberg Variations, BWV. 988` and `… BWV 988` merge into one work with two recordings. `src/lib/composers.ts` supplies dates, periods and nationalities the source data never provides, plus alias matching (`J.S. Bach`, `Bach`, `Bach , Oboe Concerto…`) and repair for double-encoded metadata (some names arrive as UTF-8 read as Windows-1252).

## Setup

```bash
npm install
```

Get a free Jamendo `client_id` at <https://devportal.jamendo.com/> — only needed for the Contemporary section and radio — and put it in `.env.local`:

```
VITE_JAMENDO_CLIENT_ID=your_client_id_here
```

The classical catalog needs no API key. The client_id is baked into the bundle and intentionally public: it's a usage identifier for Jamendo's free tier, not a secret.

```bash
npm run dev       # dev server (note: serves at /liris/)
npm run build     # type-check + production build
npm run preview   # production build — use this to test PWA/offline behaviour
```

## Player features

Playlists, favorites and recently-played live in IndexedDB. Full queue with drag-to-reorder, play-next, shuffle and repeat; Media Session lock-screen controls; offline downloads; sleep timer; an opt-in Web Audio equalizer with spectrum visualiser; JSON backup/restore; and a responsive layout with a mobile full-screen now-playing view.

## Deployment

`.github/workflows/deploy.yml` builds and deploys to GitHub Pages on every push to `main`. Because it's served from a subpath, `vite.config.ts` sets `base: '/liris/'`, the router takes its `basename` from `import.meta.env.BASE_URL`, and the workflow copies `index.html` to `404.html` (GitHub Pages has no SPA rewrite, so deep links would 404 without it). `VITE_JAMENDO_CLIENT_ID` is a repository **variable**, not a secret, for the reason above.

## Background playback on mobile

Install to the home screen for best results (Chrome: install prompt; iOS Safari: Share → Add to Home Screen).

- **Android**: audio continues when backgrounded or locked, with a media notification and hardware-button support.
- **iOS**: works in an installed home-screen app but is best-effort — iOS suspends backgrounded web apps more aggressively, and behaviour varies by version.
- **Leave the equalizer off for lock-screen listening.** It routes audio through a Web Audio `AudioContext`, which mobile browsers suspend when backgrounded; plain element playback survives, Web Audio often doesn't. The panel warns about this on iOS, and the context is resumed on foregrounding. Radio streams always bypass the graph.
- The sleep timer is wall-clock based (checked on media `timeupdate` and on foregrounding), so throttled background timers can't make it fire late.

## Known platform caveats

- **iOS**: programmatic volume is ignored, so the volume slider is hidden there.
- **Safari** may evict IndexedDB after 7 days of non-use for non-installed apps — installing protects your library.
- Folder import is desktop-only (`webkitdirectory`); mobile uses multi-file select.
- Audio streams deliberately bypass the service worker: they rely on HTTP Range requests, which a cached response would break.
