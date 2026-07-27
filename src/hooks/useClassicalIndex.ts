import { useAsync } from './useAsync'
import {
  getClassicalIndex,
  type ClassicalIndex,
} from '../services/archive/classicalIndex'

/** The whole catalog index; memoised in the service, so this is cheap to call. */
export function useClassicalIndex(): {
  data?: ClassicalIndex
  error?: Error
  loading: boolean
} {
  return useAsync(getClassicalIndex, [], true, 'classical-index')
}
