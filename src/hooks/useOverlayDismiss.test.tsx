// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useOverlayDismiss } from './useOverlayDismiss'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

function Overlay({ name, onClose }: { name: string; onClose: () => void }) {
  useOverlayDismiss(onClose)
  return <div data-overlay={name} />
}

let root: Root
let container: HTMLDivElement
const closed: string[] = []

/** jsdom runs history traversal and popstate on a later task. */
const settle = () => act(() => new Promise<void>((r) => setTimeout(r, 20)))

function render(ui: React.ReactNode) {
  act(() => root.render(ui))
}

function pressEscape() {
  act(() => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
  })
}

beforeEach(() => {
  closed.length = 0
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(async () => {
  act(() => root.unmount())
  container.remove()
  await settle()
})

describe('useOverlayDismiss', () => {
  it('Escape closes only the topmost overlay', () => {
    render(
      <>
        <Overlay name="panel" onClose={() => closed.push('panel')} />
        <Overlay name="modal" onClose={() => closed.push('modal')} />
      </>,
    )
    pressEscape()
    expect(closed).toEqual(['modal'])
  })

  it('pushes a history entry for an overlay and pops it when the overlay closes', async () => {
    const before = window.history.state
    render(<Overlay name="a" onClose={() => closed.push('a')} />)
    const entry = window.history.state?.dismissible
    expect(entry).toBeTypeOf('number')
    expect(entry).not.toBe(before?.dismissible)

    render(null)
    await settle()
    expect(window.history.state).toEqual(before)
    // Housekeeping pop, not a gesture: nothing was told to close.
    expect(closed).toEqual([])
  })

  it('a back gesture closes the topmost overlay and leaves the one beneath open', async () => {
    render(
      <>
        <Overlay name="panel" onClose={() => closed.push('panel')} />
        <Overlay name="modal" onClose={() => closed.push('modal')} />
      </>,
    )
    act(() => window.history.back())
    await settle()
    expect(closed).toEqual(['modal'])
    // The panel's own entry is still on top, so a later close pops exactly it.
    render(<Overlay name="panel" onClose={() => closed.push('panel')} />)
    await settle()
    expect(closed).toEqual(['modal'])
  })

  it('an overlay opening as another closes adopts its entry instead of being popped', async () => {
    render(<Overlay name="menu" onClose={() => closed.push('menu')} />)
    const entry = window.history.state?.dismissible
    // Same commit: menu goes, modal arrives (e.g. "Add to playlist").
    render(<Overlay name="modal" onClose={() => closed.push('modal')} />)
    await settle()
    expect(closed).toEqual([])
    expect(window.history.state?.dismissible).toBe(entry)
    pressEscape()
    expect(closed).toEqual(['modal'])
  })
})
