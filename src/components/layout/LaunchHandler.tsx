import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { toast } from '../../lib/toast'
import { importFiles } from '../../services/localImport/importFiles'

/**
 * Consumes files opened through the OS ("Open with… Liris", registered via the
 * manifest's file_handlers) and imports them into the local library. Renders
 * nothing; mounted once at the app root. Sharing links is handled purely by
 * the manifest's share_target (GET → Search), so no code is needed for that.
 */
export default function LaunchHandler() {
  const navigate = useNavigate()

  useEffect(() => {
    const queue = window.launchQueue
    if (!queue) return
    queue.setConsumer((params) => {
      if (!params.files?.length) return
      void handleOpenedFiles(params.files, navigate)
    })
  }, [navigate])

  return null
}

async function handleOpenedFiles(
  handles: readonly FileSystemFileHandle[],
  navigate: (to: string) => void,
) {
  try {
    const files = await Promise.all(handles.map((h) => h.getFile()))
    toast(`Importing ${files.length} file${files.length === 1 ? '' : 's'}…`)
    const result = await importFiles(files, () => {})
    navigate('/library')
    if (result.added > 0) {
      toast(`Added ${result.added} track${result.added === 1 ? '' : 's'} to your library`)
    } else if (result.skipped > 0) {
      toast('Already in your library')
    } else {
      toast('Nothing to import — no supported audio files')
    }
  } catch (err) {
    console.error('Failed to open shared files', err)
    toast('Could not open those files')
  }
}
