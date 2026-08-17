/**
 * Offerings: the index, the single-offering page, and the cards on both.
 *
 * English is the source of record — see `chrome.ts` for why these files carry
 * no type annotation.
 *
 * What is NOT here: an offering's own title, description, price and location.
 * Those are frontmatter in `src/content/offerings/<slug>/index.md`, exactly as
 * a post's title is frontmatter rather than a catalog key. The split is the
 * same one `blog.ts` draws — this file holds the CHROME around the content,
 * never the content.
 *
 * The category labels are not here either. They live in
 * `src/content/offeringCategories.js`, because a bare-node script
 * (`offerings-check.mjs`) validates against that list and a second copy here
 * would be free to drift from the one the validator reads.
 */

const offerings = {
  /** Head metadata for /offerings. A page's title is that page's words. */
  meta: {
    title: 'Offerings',
    description:
      'Ceremonies, retreats and gatherings at Ayni Sanctuary in Calca, Sacred Valley. Dates, what each one is, and how to reach us about coming.'
  },

  index: {
    eyebrow: 'Offerings',
    title: 'What we hold space for.',
    lead: 'Ceremonies, retreats and gatherings, as they are scheduled. Write to us about any of them.',

    /**
     * The category filter. `all` is a chip like the others rather than a
     * "clear" affordance, so the filter row always has exactly one thing
     * selected and never reads as an empty state.
     */
    filters: {
      label: 'Filter by category',
      all: 'All'
    },

    /**
     * Upcoming and past are a toggle, not a filter chip: they answer a
     * different question ("is this still ahead?") and stacking them into the
     * same row as categories would let a reader select a combination that
     * looks like two filters of one kind.
     */
    when: {
      label: 'Show',
      upcoming: 'Upcoming',
      past: 'Past'
    },

    /**
     * Three empty states, because they mean three different things and a
     * single "nothing here" would be a worse answer to all of them.
     */
    empty: 'Nothing is scheduled yet. Write to us and we will tell you what is coming.',
    emptyUpcoming: 'Nothing upcoming in this category right now.',
    emptyPast: 'Nothing has happened in this category yet.'
  },

  card: {
    /** Read-more line at the foot of each card. */
    cta: 'See details',
    /**
     * Marks an offering whose date has passed. Kept visible rather than
     * hiding past offerings outright — they are a record of what the
     * sanctuary actually does, which is worth more than a tidy list.
     */
    past: 'Past'
  },

  detail: {
    crumbs: {
      label: 'Breadcrumb',
      home: 'Home',
      offerings: 'Offerings'
    },
    /** Field labels on the single-offering page. */
    when: 'When',
    where: 'Where',
    price: 'Contribution',
    /** Heading above the row of contact actions. */
    actions: 'Come, or ask us anything',
    /** Shown in place of the actions row when no channel is configured. */
    noActions: 'Contact details are being set up. Write to us in the meantime.'
  },

  /**
   * Accessible names for the action row. Each names the DESTINATION, not just
   * the platform — "Ask about this on WhatsApp" tells a screen-reader user
   * what pressing it does, where a bare "WhatsApp" only says where it goes.
   */
  actions: {
    whatsapp: 'Ask about this on WhatsApp',
    instagram: 'See Ayni Sanctuary on Instagram',
    maps: 'Open the location in Google Maps',
    email: 'Write to us about this offering'
  },

  /**
   * The one offering a homepage category leads with.
   *
   * `next` / `last` take the category's SINGULAR noun from
   * `src/content/offeringCategories.js` — "Next ceremony", "Last retreat".
   * See that file for the Spanish gender-agreement wrinkle these two
   * functions cannot express on their own.
   */
  featured: {
    next: (singular: string) => `Next ${singular}`,
    last: (singular: string) => `Last ${singular}`
  },

  /**
   * The scroller's CTA, which now filters rather than just linking. Takes the
   * category's plural label: "All ceremonies". `index.filters.all` stays a
   * separate string — it labels a chip meaning "no filter", not this.
   */
  allInCategory: (label: string) => `All ${label.toLowerCase()}`,

  /**
   * Date formatting. Both are functions rather than templates with a
   * placeholder: a range reads `5 – 8 August 2026` in English and
   * `del 5 al 8 de agosto de 2026` in Spanish, which no substitution scheme
   * produces from one pattern. They receive dates ALREADY formatted by
   * `$lib/offerings/format.ts`, so the locale's month names come from `Intl`
   * and only the joining words live here.
   */
  dateRange: (start: string, end: string) => `${start} – ${end}`,
  /**
   * Prefilled first line of a WhatsApp message. The reader can edit it before
   * sending; it exists so the sanctuary knows which offering the question is
   * about without having to ask.
   */
  whatsappMessage: (title: string) => `Hola! I'd like to ask about "${title}".`
};

export default offerings;
