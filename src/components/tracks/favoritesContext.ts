import { createContext } from 'react'

/**
 * Favorite track ids for the surrounding TrackList, loaded with ONE live
 * query and shared with every row — per-row queries would mean N IndexedDB
 * reads + N subscriptions (145 on the larger archive collections).
 * `undefined` = still loading (or no provider).
 */
export const FavoriteIdsContext = createContext<Set<string> | undefined>(undefined)

/** Ids of tracks with an offline download, same one-query-per-list pattern. */
export const DownloadedIdsContext = createContext<Set<string> | undefined>(undefined)
