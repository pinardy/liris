import type { ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../services/db/db'
import { getDownloadedIds } from '../../services/db/downloads'
import type { Track } from '../../types/model'
import { DownloadedIdsContext, FavoriteIdsContext } from './favoritesContext'
import TrackActions from './TrackActions'
import TrackRow from './TrackRow'

interface Props {
  tracks: Track[]
  /** Called with the clicked index; typically starts playback of the whole list as a queue. */
  onPlay: (index: number) => void
  /** Defaults to the standard favorite + overflow-menu actions. */
  renderActions?: (track: Track) => ReactNode
}

const defaultActions = (track: Track) => <TrackActions track={track} />

export default function TrackList({
  tracks,
  onPlay,
  renderActions = defaultActions,
}: Props) {
  const favoriteIds = useLiveQuery(
    () => db.favorites.toArray().then((rows) => new Set(rows.map((r) => r.trackId))),
    [],
  )
  const downloadedIds = useLiveQuery(getDownloadedIds, [])

  return (
    <FavoriteIdsContext.Provider value={favoriteIds}>
      <DownloadedIdsContext.Provider value={downloadedIds}>
        <div className="flex flex-col">
          {tracks.map((track, i) => (
            <TrackRow
              key={track.id}
              track={track}
              index={i}
              onPlay={() => onPlay(i)}
              actions={renderActions?.(track)}
            />
          ))}
        </div>
      </DownloadedIdsContext.Provider>
    </FavoriteIdsContext.Provider>
  )
}
