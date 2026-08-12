/**
 * Phone menu open/closed state, shared.
 *
 * It lives outside both components because the two halves of the menu cannot
 * live together: the toggle belongs INSIDE NavContent, so it inherits each
 * navbar's colour through the site's two-layer clip trick, while the panel
 * must sit OUTSIDE both navbars or it would be duplicated and clipped to the
 * 60px header. One is rendered twice, the other once, and they need to agree.
 *
 * A rune-backed object rather than a plain boolean so the reference can be
 * imported and mutated from either side.
 */
export const menu = $state({ open: false });
