/**
 * Where the visitor entered the journal's notes from.
 *
 * From the homepage's strip of journal cards, "back" should return to the
 * HOMEPAGE — to the exact spot they left, which history.back() restores
 * (SvelteKit's scroll restoration replays the saved position on popstate) —
 * not to the journal list they never asked to see. The list-and-breadcrumb
 * loop belongs only to visitors who entered the journal deliberately.
 *
 * +layout.svelte keeps this current on every route change: arrival at a
 * note from "/" is 'home'; arrival from any other path is 'journal' — so
 * the list, topic pages, and following a related card from another note
 * all count as being inside the loop. On a fresh load it infers from
 * document.referrer instead (and marks viaSpa false, because there is no
 * in-site history entry history.back() could replay).
 */
export const blogEntry = $state({
  from: 'journal' as 'home' | 'journal',
  /** True when the entry was an in-app navigation, so history.back() is
   * guaranteed to land back where the visitor came from. */
  viaSpa: false,
});
