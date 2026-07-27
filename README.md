# liris — Free Music Player PWA

A free, Spotify-like music player built with React + TypeScript. Installable as a PWA, works offline, and costs nothing to run — there is no backend.

Music comes from three legal, free sources:

1. **Jamendo** — a catalog of ~500k Creative Commons tracks, streamed via the free [Jamendo API](https://developer.jamendo.com/v3.0) (search, albums, artists, trending, genres).
2. **Internet Archive** — curated public-domain classical recordings (the Musopen collections, the Open Goldberg Variations, 100 Classical Masterpieces), streamed from archive.org. Surfaced under the Classical genre; the allowlist lives in `src/services/archive/api.ts`.
3. **Your own files** — import MP3/FLAC/M4A/OGG from your device. They're stored in the browser (IndexedDB), indexed with proper tags and cover art, and play fully offline. Files never leave your device.

Playlists, favorites, and recently-played are stored locally in IndexedDB. No accounts, no tracking.

## Setup

```bash
npm install
```

Get a free Jamendo `client_id` at <https://devportal.jamendo.com/> (instant signup), then put it in `.env.local`:

```
VITE_JAMENDO_CLIENT_ID=your_client_id_here
```

> The client_id is baked into the client bundle and **intentionally public** — it's a usage identifier for Jamendo's free tier, not a secret. Don't "fix" this by moving it server-side; there is no server.

## Develop

```bash
npm run dev       # dev server (service worker disabled)
npm run build     # type-check + production build
npm run preview   # serve the production build — use this to test PWA/offline behavior
```

## Architecture notes

- `src/types/model.ts` — the unified `Track` type. Everything downstream (queue, playlists, favorites, player) is source-agnostic; only `services/jamendo/mappers.ts` and `player/resolveSource.ts` know where audio comes from.
- `src/player/audioEngine.ts` — a singleton `HTMLAudioElement` living outside React. Store actions send commands in; element events sync state back into the Zustand store (`playerStore.ts`). `timeupdate` writes are throttled and only the seek bar subscribes to position, so playback doesn't re-render the app.
- `src/services/db/db.ts` — Dexie schema. Audio/artwork blobs live in separate tables from track metadata so listing the library never touches file bytes. Jamendo tracks added to playlists/favorites are snapshotted into the `tracks` table so those views render offline.
- Local file import (`services/localImport/`) parses tags with `music-metadata` (dynamically imported — it never loads unless you import files), downscales cover art to ≤512px JPEG, dedupes by filename+size, and requests persistent storage.
- **Service worker** (vite-plugin-pwa/Workbox): precaches the app shell, `NetworkFirst` for Jamendo API responses, `CacheFirst` for artwork. Audio stream URLs are deliberately **not** routed through the SW — they rely on HTTP Range requests for seeking, which cached responses would break.

## Background playback on mobile

Install to the home screen for the best results (Chrome: install prompt; iOS Safari: Share → Add to Home Screen).

- **Android**: audio continues when backgrounded or the screen locks, with a media notification and hardware-button support via the Media Session API.
- **iOS**: works in an installed home-screen app but is best-effort — iOS suspends backgrounded web apps more aggressively than Android, and behavior varies by version.
- **Leave the equalizer off for lock-screen listening.** Enabling it routes audio through a Web Audio `AudioContext`, which mobile browsers suspend when the app is backgrounded; plain element playback survives backgrounding, Web Audio often doesn't. The panel warns about this on iOS, and the context is resumed automatically when the app returns to the foreground. Radio streams always bypass the graph.
- The sleep timer is wall-clock based (checked on media `timeupdate` and on foregrounding), so throttled background timers can't make it fire late.

## Known platform caveats

- **iOS**: programmatic volume is ignored (the slider is hidden on iOS); lock-screen controls in installed-PWA mode are best-effort.
- **Safari** may evict IndexedDB after 7 days of non-use for non-installed web apps — installing the app to the home screen protects the library.
- Folder import is desktop-only (`webkitdirectory`); on mobile use multi-file select.
- Jamendo's free tier has a monthly request quota; search is debounced and API responses are cached by the service worker to stay well under it.
