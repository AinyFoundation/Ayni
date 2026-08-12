/**
 * Chrome — everything that frames the page rather than being the page:
 * navigation, the phone menu, the footer.
 *
 * English is the SOURCE OF RECORD. These files are deliberately NOT annotated
 * with a type: `Messages` is derived from them, so annotating them would be
 * circular. Added locales are annotated instead (`Messages['chrome']`), which
 * is what makes a missing or misspelled key a compile error there.
 *
 * Filled from the components in Phase 2. See
 * `docs/research/i18n-system/research.md` § Phasing.
 */

const chrome = {
  /**
   * The six destinations, keyed the way `NavLink.key` indexes them.
   *
   * LINK LABELS ONLY. `$lib/nav` types its key as
   * `keyof Messages['chrome']['nav']`, so anything else added here — a
   * landmark name, a tooltip — would silently become a legal nav key that
   * renders the wrong word. Accessible names live under `aria` for exactly
   * that reason.
   */
  nav: {
    home: 'Home',
    offerings: 'Offerings',
    retreats: 'Retreats',
    book: 'Book',
    journal: 'Journal',
    visit: 'Visit'
  },
  /**
   * The footer's two lines of address to the reader.
   *
   * Separate from `nav` on purpose: `NavLink.key` is typed
   * `keyof Messages['chrome']['nav']`, so a sentence added there would become a
   * legal nav key that renders a paragraph inside a doorway.
   */
  footer: {
    /** Perfect, not present: the reader has arrived, they are not arriving
     * repeatedly. */
    end: "You've reached the end.",
    invite: 'Want to know more?'
  },
  /**
   * Accessible names for the two social marks, keyed the way
   * `SocialMark.key` indexes them.
   *
   * In `chrome` rather than `home` because the same two links now sit on two
   * surfaces — the hero corner and the footer's bottom right — and a label
   * written twice is a label free to drift. Same reasoning as `aria` below.
   */
  social: {
    instagram: 'Ayni Sanctuary on Instagram',
    facebook: 'Ayni Sanctuary on Facebook'
  },
  menu: {
    /** Accessible name for the three-line toggle in the header. */
    open: 'Open menu',
    close: 'Close menu',
    /** Accessible name for the <dialog> itself. */
    label: 'Site navigation'
  },
  /**
   * Names that exist only for assistive tech.
   *
   * Grouped by PURPOSE rather than by surface — the exception to the barrel's
   * split-by-surface rule — because each of these labels the same thing in
   * several places at once: the wordmark link is in both navbars, the phone
   * panel and the footer, and `mainNav` names the header row and the panel's
   * list, which are one landmark to a screen reader since only one of them is
   * ever in the accessibility tree. Keyed by surface they would have to be
   * written three times and could then drift apart.
   */
  aria: {
    /** The wordmark link. It has to name its DESTINATION, not just the brand:
     * the artwork inside it is decorative (`alt=""`), so without this the link
     * has no accessible name at all. */
    homeLink: 'Ayni, home',
    mainNav: 'Main navigation',
    footerNav: 'Footer',
    /** The language switcher's trigger. Names the ACTION, not the current
     *  language — the visible short tag beside it already says which that is,
     *  and a control called "English" reads as a statement, not a button. */
    language: 'Change language'
  },
  skipToContent: 'Skip to content'
};

export default chrome;
