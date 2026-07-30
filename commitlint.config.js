/**
 * Conventional Commits, checked by the husky `commit-msg` hook.
 *
 * The default type set (feat, fix, refactor, test, ci, chore, docs, perf,
 * style, build, revert) already matches this repo's history, so the shared
 * config is taken as-is rather than restated — every rule below the surface
 * is one more thing to keep in sync with nothing.
 */
export default {
  extends: ['@commitlint/config-conventional'],
}
