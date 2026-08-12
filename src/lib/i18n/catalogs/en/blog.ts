/**
 * The journal: index, post page, topic pillars, and the homepage strip.
 *
 * English is the source of record — see `chrome.ts` for why these files carry
 * no type annotation.
 *
 * Interpolation is a typed function, not a `{{placeholder}}` string. The
 * compiler then checks the call site, and each language expresses its own
 * word order — `readingTime` reads `4 min read` in English and
 * `4 min de lectura` in Spanish, which no placeholder scheme gets right by
 * substitution alone.
 *
 * Arrows and separators are NOT here. `← Prev`, `Next →` and `Filed under
 * <topic>.` keep their glyph in the template, matching what the extraction
 * check already treats as untranslatable and what the post page's CTA link
 * (`{label} →`) was already doing. A sentence split around an inline link or
 * button is two keys, not one key with markup in it.
 */

const blog = {
  /** Reading time, rendered beside the date on every card and article. */
  readingTime: (minutes: number) => `${minutes} min read`,

  /**
   * The breadcrumb trail. One group rather than one set per route: the article
   * and the pillar pages render the same landmark with the same words, and the
   * JSON-LD trail fed to `breadcrumbs()` has to say exactly what the visible
   * trail says or the two disagree in search results.
   */
  crumbs: {
    /** Accessible name for the nav landmark itself. */
    label: 'Breadcrumb',
    /**
     * `history.back()` for visitors who arrived from the homepage strip — they
     * asked for the note, not for the journal list. See `$lib/blogNav.svelte.ts`.
     */
    back: 'Back',
    home: 'Home',
    journal: 'Journal'
  },

  card: {
    /**
     * Accessible name for the ink-and-dots band a post without a cover gets.
     * It is a `role="img"`, so without a name it announces as nothing at all.
     */
    media: 'Ayni Sanctuary journal',
    /** Read-more line at the foot of the card; the reading time follows it. */
    cta: 'Read this note'
  },

  /**
   * The homepage's three-card strip. Its link out reads `index.all`, which
   * names the destination rather than this section, so it stays there.
   */
  strip: {
    /**
     * Two headlines. With nothing published the strip does not pretend to be a
     * list that happens to be empty — it says what it is instead.
     */
    headline: 'Read the journal.',
    headlineEmpty: 'Field notes, forthcoming.',
    empty: 'The first notes from Calca are being written. They will appear here.'
  },

  index: {
    /** Link out of the homepage journal strip. */
    all: 'All journal entries',
    /**
     * Head metadata for /blog. Here rather than in `seo` so the page and its
     * head read one source; the feeds and the sitemap still take their copy
     * from `SITE` until they become locale-aware in Phase 3.
     */
    meta: {
      title: 'Notes from the Valley',
      description:
        'Field notes from Ayni Sanctuary in Calca, Perú. Ceremony, the land, food grown where it is eaten, and the rhythms of the Sacred Valley.'
    },
    title: 'Field notes from Calca.',
    lead: 'Ceremony, the land, food grown steps from where it is eaten, and the rhythms of a valley that sets its own schedule. Written by the people living here.',
    search: {
      placeholder: 'Search posts...',
      /** The field has no visible label; the magnifier is decorative. */
      label: 'Search blog posts',
      clear: 'Clear search'
    },
    /** Accessible name for the row of topic chips. */
    topicsLabel: 'Topics',
    /** The dashed chip that appears once a filter is on. */
    clearFilters: 'Clear filters',
    /**
     * `1 post found` / `12 posts found`.
     *
     * The plural is a ternary INSIDE the message so each language picks its
     * own rule; English and Spanish both need exactly two forms, and reaching
     * for `Intl.PluralRules` before a language needs more is cost without use.
     */
    resultsCount: (count: number) =>
      `${count} ${count === 1 ? 'post' : 'posts'} found`,
    /** Split around the inline "clear all filters" button. */
    noMatches: {
      before: 'No posts match your filters. Try a different search or',
      action: 'clear all filters'
    },
    empty: 'Nothing published yet. The first notes are being written in Calca.',
    pagination: {
      /** Accessible name for the nav landmark. */
      label: 'Blog pages',
      prev: 'Prev',
      next: 'Next',
      /** Accessible names — the visible arrows alone do not read as anything. */
      prevLabel: 'Previous page',
      nextLabel: 'Next page',
      pageLabel: (page: number) => `Page ${page}`
    }
  },

  post: {
    /** `updated 12 August 2026` — the date arrives already formatted. */
    updated: (date: string) => `updated ${date}`,
    /** Heading and accessible name for the outline rail. One string, both uses. */
    toc: 'On this page',
    /** Precedes the topic link in the footer: `Filed under Ceremony.` */
    filedUnder: 'Filed under',
    readNext: 'Read next'
  },

  topic: {
    /** Split around the inline link back to the full journal. */
    empty: {
      before: 'No notes filed here yet.',
      link: 'The rest of the journal',
      after: 'is that way.'
    }
  }
};

export default blog;
