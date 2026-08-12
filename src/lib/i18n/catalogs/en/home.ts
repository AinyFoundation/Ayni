/**
 * The homepage journey: hero, welcome panel, offerings, retreats, the book
 * spreads, voices and the contact/visit section.
 *
 * English is the source of record — see `chrome.ts` for why these files carry
 * no type annotation.
 *
 * The editorial arrays (`welcome.greetings`, `offerings.categories`,
 * `book.entries`) live here in full. What stayed behind in the components is
 * STRUCTURE — photographs, hues, slugs, and the index-driven choreography that
 * reads them — because a translator has to be able to rewrite the words without
 * ever touching a card deck's z-order or a book spread's left/right parity. The
 * two halves are joined by ARRAY POSITION, so the order of every array below is
 * load-bearing: entry 0 here is entry 0 there. Adding or removing one means
 * adding or removing the matching structural entry in the same commit.
 *
 * What is deliberately NOT here: the scraped Google reviews. Those are claims
 * by real people about a real business, carried verbatim from
 * `src/lib/data/reviews.json`; putting them in a catalog would invite someone
 * to reword them, which is consumer deception. Only the chrome around them
 * (headings, the badge, the empty state) is translatable.
 */

const home = {
  /**
   * The homepage's own <head>. It sits in this domain rather than in `seo` so
   * that the page's words all live in one file — `seo` holds the strings shared
   * across routes. Note that `Seo` renders the bare site name as the <title>
   * whenever `path === '/'`, so `title` here is the value that would be used
   * if that ever stops being true.
   */
  seo: {
    title: 'Ayni Consciousness Collective',
    description:
      'A seven-wing sovereign ecosystem rooted in Calca, Sacred Valley, Perú — sanctuary, wellness, energy, art, learning, games and labs.'
  },

  hero: {
    title: 'Return to the Rhythm of Earth.',
    subtitle:
      'Ayni is the sacred balance of giving and receiving. Leave behind the noise of the modern world and remember the harmony that already lives within you.',
    /** The photograph the whole page opens on. */
    imageAlt: 'Sacred Valley Sanctuary'
    /* The two social marks used to be labelled from here. They moved to
     * `chrome.social` when the footer started rendering the same two links —
     * see the comment there. */
  },

  welcome: {
    /**
     * The greeting that opens panel two, one picked at random per visit.
     *
     * `qu` is Quechua and stays Quechua in every locale — it IS the greeting.
     * `en` is its gloss, and that is the half a translation rewrites. Both
     * fields are carried so a locale keeps the pairing intact instead of
     * re-deriving which Quechua word it is glossing.
     */
    greetings: [
      { qu: "Allin p'unchaw", en: 'good day' },
      { qu: 'Haykuykuy', en: 'come in' },
      { qu: 'Urpillay sonqollay', en: 'gratitude' },
      { qu: 'Rimaykullayki', en: 'hello' },
      { qu: 'Napaykullayki', en: 'I greet you' },
      { qu: 'Hamuy', en: 'welcome' },
      { qu: 'Añay', en: 'thank you' }
    ],
    /**
     * Set on one line by the desktop stylesheet (`white-space: nowrap` against
     * a vw-sized face), so a translation that runs much longer will wrap on a
     * phone and only there. Keep it short.
     */
    title: "We are happy you're here.",
    body1: "This valley has welcomed people for generations. We're simply here to share it with you.",
    body2:
      'Take your time. Breathe the mountain air. Enjoy good food, quiet mornings, and the gentle rhythm of the Sacred Valley.',
    closing: 'The door is open.',
    imageAlt:
      'Adobe bungalows with thatched roofs along a stone path at Ayni Sanctuary, Sacred Valley'
  },

  offerings: {
    /** Small label above the category list. */
    eyebrow: 'Offerings',
    /** `01 / 03` — the position counter beside the pinned image. */
    counter: (current: number, total: number) =>
      `${String(current).padStart(2, '0')} / ${String(total).padStart(2, '0')}`,
    /** CTA button inside each offering panel. */
    allOfferings: 'All offerings',
    /**
     * One entry per card in the pinned deck, IN DECK ORDER — the component
     * holds the matching photograph and wing hue at the same index.
     *
     * PLACEHOLDER copy, exactly as it was in the component: these titles and
     * blurbs are stand-ins until the real offerings are written. Translating a
     * placeholder is wasted work, so a new locale can leave them in English
     * until they are replaced.
     */
    categories: [
      {
        tag: 'Offering',
        title: 'Retreats',
        blurb: 'Days shaped by the land. Small groups, no rush, just the valley, the mountains, and whatever you came here to find.',
        imageAlt: 'Bungalows nestled among the gardens at Ayni Sanctuary, Sacred Valley'
      },
      {
        tag: 'Offering',
        title: 'Ceremonies',
        blurb: 'Shipibo ayahuasca, temazcal, ancient medicines held with care. Fire, song, and the patience that ceremony asks of everyone who enters.',
        imageAlt: 'Gathering at Ayni Sanctuary for ceremony in the Sacred Valley'
      },
      {
        tag: 'Offering',
        title: 'Events',
        blurb: 'Not every gathering needs a reason. Sometimes the valley calls people together, and we make space for what happens.',
        imageAlt: 'Community gathering at Ayni Sanctuary in the Sacred Valley'
      }
    ]
  },

  retreats: {
    headline: 'Come as you are.',
    body: 'We are open for small number of retreats each season; ceremonies, good food, and long quiet days on the land.',
    findRetreat: 'Find a retreat',
    stay: 'Stay with us',
    note: 'Small groups, kept personal.'
  },

  book: {
    /** Accessible name for the section, and for the book widget inside it. */
    label: 'A book of days',
    /** Read in place of "group", so the widget announces as what it is. */
    roledescription: 'book',
    previous: '← Previous',
    next: 'Next →',
    /**
     * The live region that stands in for the page turn nobody can see. A
     * function rather than three fragments because the order of "page", the
     * numbers and the title is a property of the language.
     */
    page: (current: number, total: number, title: string) =>
      `Page ${current} of ${total}: ${title}`,
    /**
     * One spread per entry, IN SPREAD ORDER — the component holds the matching
     * photograph, slug and hue at the same index, and decides which side of the
     * spine the picture falls on from that index's parity. Reordering here
     * would silently swap the photographs their stories belong to.
     *
     * PLACEHOLDER captions, marked as such in the text itself and carried
     * through unchanged. The photographs are re-used stock from the three sets
     * that exist; every entry is replaced when real ones arrive, so the count
     * must stay EVEN for the alternation to loop cleanly.
     */
    entries: [
      {
        alt: 'The sanctuary buildings and gardens below the mountains at dawn',
        title: 'First light on the land',
        caption:
          'PLACEHOLDER. The valley wakes before we do. Mornings begin outside, with the mountains still deciding what colour they are, and the day arranges itself from there.'
      },
      {
        alt: 'The temazcal lodge with the fire burning outside it',
        title: 'Before the door closes',
        caption:
          'PLACEHOLDER. The fire is lit hours before anyone enters. Stones are counted, water is drawn, and the round is prepared slowly, because the preparation is most of the ceremony.'
      },
      {
        alt: 'Bungalows among the gardens of the sanctuary',
        title: 'Where you sleep',
        caption:
          'PLACEHOLDER. Small bungalows set apart from one another, so that quiet is the default and company is something you choose rather than something you are given.'
      },
      {
        alt: 'The Sacred Valley seen from the sanctuary terrace',
        title: 'The valley, from the terrace',
        caption:
          'PLACEHOLDER. Calca sits between the river and the ridge. Weather arrives from the west and announces itself early, so you learn to read the afternoon from what the mountains are doing at noon.'
      },
      {
        alt: 'The fire outside the temazcal at dusk',
        title: 'The keeper of the fire',
        caption:
          'PLACEHOLDER. Someone tends the fire the whole night. It is the least visible work of a ceremony and the one everything else rests on.'
      },
      {
        alt: 'The sanctuary gardens in the morning',
        title: 'Morning, slowly',
        caption:
          'PLACEHOLDER. No bell, no schedule pinned to a wall. The kitchen opens, the land is walked, and the day assembles itself out of whoever turns up.'
      }
    ]
  },

  voices: {
    eyebrow: 'In Their Words',
    title: 'What’s being said.',
    /** Google's own badge on a reviewer, carried through from the scrape. */
    localGuide: 'Local Guide',
    /** Accessible name for the star row on a card. */
    rating: (stars: number) => `${stars} stars`,
    /**
     * The oversized opening quotation mark. A catalog entry and not a literal
     * because the glyph itself is language, not decoration: Spanish opens a
     * quotation with « and German with „.
     */
    quoteMark: '“',
    viewAll: (count: number) => `View all ${count} reviews →`,
    empty: 'Reviews will appear here once scraped from Google Maps.',
    /**
     * Split around the <code> element naming the command. Two fragments rather
     * than one sentence because the command is markup, not words, and the
     * spaces belong to the fragments so the rendered line is unchanged. A
     * language that puts the command first simply moves the words between them.
     */
    emptyHintBefore: 'Run ',
    emptyHintAfter: ' to fetch reviews.',
    /** The dialog behind "View all reviews". */
    popup: {
      title: 'What people say',
      subtitle: (count: number) => `${count} reviews from Google Maps`,
      close: 'Close',
      rating: (stars: number) => `${stars} out of 5 stars`,
      viewOnMaps: 'View on Google Maps →'
    }
  },

  contact: {
    title: 'Come find us.',
    body: 'Tell us what you are looking for and we will write back. We read everything ourselves, so give us a day or two.',
    form: {
      name: 'Your name',
      email: 'Email',
      reason: 'What brings you',
      /**
       * Each option is its own submitted VALUE as well as its label, so a
       * translation also translates the payload. That is the right trade while
       * the only reader of that payload is a person opening their own inbox;
       * if a machine ever consumes it, split label from value here first.
       */
      reasons: ['A retreat', 'A ceremony', 'Staying at the sanctuary', 'Something else'],
      message: 'Your message',
      /**
       * The honeypot's label. Never seen and never read aloud — the field is
       * off-screen and aria-hidden — but it has to look like a real field to a
       * script reading the DOM, which is the whole trap.
       */
      company: 'Company',
      submit: 'Send a message'
    },
    /**
     * The line under the button. Which one shows depends on how the form is
     * wired at build time (see `$lib/config`), so all three ship.
     */
    hint: {
      composing: (email: string) =>
        `Opening your mail app. If nothing happens, write to ${email}.`,
      mailto: 'This opens your own mail app — nothing is sent through a third party.',
      endpoint: 'We answer from a real person, not an autoresponder.'
    },
    /**
     * Subject line of the mailto: compose, which is text the visitor sees in
     * their own mail client. Both halves are optional in the source sentence
     * and the ternaries live here rather than at the call site, because where a
     * name goes in a subject line is a property of the language.
     */
    mailSubject: (reason: string, name: string) =>
      `Ayni — ${reason || 'a message'}${name ? ` from ${name}` : ''}`,
    placeNote: 'Up the valley from Pisac, an hour and a half from Cusco by road.',
    /** Outbound link under the drawn valley map. */
    openInMaps: 'Open in Google Maps'
  },

  /**
   * The drawn Sacred Valley. Only the accessible description is here: the town
   * names and the compass letter are geography, the scale bar is a unit, and
   * the OpenStreetMap credit under the frame is an ODbL obligation with
   * required wording. None of the three is ours to translate.
   */
  map: {
    label:
      'Map of the Sacred Valley showing the Urubamba river running from Ollantaytambo through Urubamba, Yucay and Calca to Pisac. Calca, where the sanctuary sits, is marked.'
  }
};

export default home;
