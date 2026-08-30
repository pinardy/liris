/**
 * Which overlay is on top.
 *
 * Every dismissible surface listens for Escape on `document` in the capture
 * phase, and stopPropagation does NOT stop sibling listeners already attached
 * to the same node — so without this, one Escape closed the modal AND the
 * queue panel underneath it. Each surface registers here and acts only when
 * it is the topmost, which is the one the key was meant for.
 *
 * Registration happens in an effect, and effects run in mount order, so the
 * most recently opened overlay is last — exactly the ordering we want.
 */
const stack: object[] = []

export function registerOverlay(token: object): () => void {
  stack.push(token)
  return () => {
    const i = stack.indexOf(token)
    if (i >= 0) stack.splice(i, 1)
  }
}

export function isTopmostOverlay(token: object): boolean {
  return stack.length > 0 && stack[stack.length - 1] === token
}
