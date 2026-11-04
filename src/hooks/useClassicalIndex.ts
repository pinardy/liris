import { useCallback, useState } from 'react'
import { invalidateAsync, useAsync } from './useAsync'
import {
  getClassicalIndex,
  resetClassicalIndex,
  type ClassicalIndex,
} from '../services/archive/classicalIndex'

const CACHE_KEY = 'classical-index'

/** The whole catalog index; memoised in the service, so this is cheap to call.
 *  `retry` throws away every cached copy and fetches again — the way back from
 *  an offline boot without reloading the app (and losing playback). */
export function useClassicalIndex(): {
  data?: ClassicalIndex
  error?: Error
  loading: boolean
  retry: () => void
} {
  const [attempt, setAttempt] = useState(0)
  const state = useAsync(getClassicalIndex, [attempt], true, CACHE_KEY)
  const retry = useCallback(() => {
    resetClassicalIndex()
    invalidateAsync(CACHE_KEY)
    setAttempt((a) => a + 1)
  }, [])
  return { ...state, retry }
}
