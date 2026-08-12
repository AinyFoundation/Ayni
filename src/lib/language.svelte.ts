/**
 * Language switcher open/closed state, shared.
 *
 * Split for the same reason the phone menu is (see `$lib/menu.svelte`): the
 * TRIGGER belongs inside NavContent, where `currentColor` gives it ink on the
 * white navbar and paper on the black one through the site's two-layer clip.
 * The PANEL cannot be there — NavContent is rendered twice, so the panel would
 * exist twice, and the white copy is clipped to the 60px header and could
 * never open. It is rendered once in `+layout.svelte` instead.
 *
 * A rune-backed object rather than a plain boolean so the reference can be
 * imported and mutated from either side.
 */
export const languageMenu = $state({ open: false });
