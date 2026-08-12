/**
 * Blog topic clusters — the hub-and-spoke taxonomy.
 *
 * Each topic is a pillar page at /blog/topic/<slug>. Every post declares
 * exactly one, links back to its pillar, and the pillar links out to every
 * post in the cluster. Isolated posts do not rank; clusters do. See
 * `docs/research/blog-system/research.md` § Content structure.
 *
 * Plain JS with JSDoc rather than TypeScript on purpose: `scripts/blog-check.mjs`
 * runs under bare node with no build step and must validate against the same
 * list the app renders from. One source of truth beats two that drift.
 *
 * `cta` is the DESIRED destination. None of these routes exist yet, so
 * `src/lib/blog/cta.ts` resolves each against the real route manifest and
 * degrades to nothing rather than shipping a 404.
 */

/**
 * @typedef {object} TopicCta
 * @property {string} href     Desired destination, may not exist yet.
 * @property {string} label    Link text. A real noun phrase, never "click here".
 * @property {string} blurb    One sentence for the end-of-post card.
 */

/**
 * @typedef {object} Topic
 * @property {string} slug
 * @property {string} label        Short form, used on cards and eyebrows.
 * @property {string} title        Pillar page <h1>.
 * @property {string} description  Pillar meta description, 110-160 chars.
 * @property {string} intro        Pillar standfirst.
 * @property {TopicCta} cta
 */

/** @type {Topic[]} */
export const TOPICS = [
  {
    slug: 'ceremony',
    label: 'Ceremony',
    title: 'Ceremony',
    description:
      'Notes on ceremony at Ayni Sanctuary: how a night is held, what it asks of you, and the quiet work that happens between songs.',
    intro:
      'What happens in the maloca, written down plainly. How a night is held, what preparation actually looks like, and what the days afterwards ask of you.',
    cta: {
      href: '/sanctuary#ceremonies',
      label: 'ceremonies at the sanctuary',
      blurb: 'Ceremonies run through the year in Calca. You can read how they are held.'
    }
  },
  {
    slug: 'the-land',
    label: 'The Land',
    title: 'The Land',
    description:
      'The valley as a working system: terraces, water, weather and soil, and how regenerative practice reads the ground before changing it.',
    intro:
      'The valley is not scenery, it is a working system. Terraces, water, weather, soil, and what the land tells you if you read it before you change it.',
    cta: {
      href: '/wings/energy',
      label: 'the regenerative work in Calca',
      blurb: 'Energy, permaculture and soil work in the Sacred Valley run under Ayni Energy.'
    }
  },
  {
    slug: 'farm-and-food',
    label: 'Farm & Food',
    title: 'Farm & Food',
    description:
      'Food grown steps from where it is eaten. Seasons, the open fire, and what the kitchen at Ayni Sanctuary does with what the valley gives it.',
    intro:
      'Slow mornings, open fire, and food grown steps from where it is eaten. What the kitchen does with what the valley gives it, season by season.',
    cta: {
      href: '/sanctuary#restaurant',
      label: 'the kitchen at the sanctuary',
      blurb: 'The restaurant cooks what the farm brings in that morning.'
    }
  },
  {
    slug: 'retreats',
    label: 'Retreats & Stays',
    title: 'Retreats & Stays',
    description:
      'How a retreat at Ayni Sanctuary is paced, what a week actually looks like, and how to tell which one you are ready for.',
    intro:
      'How a stay is paced, what a week actually contains, and how to work out which retreat you are ready for. Written for people deciding.',
    cta: {
      href: '/sanctuary#stay',
      label: 'staying at the sanctuary',
      blurb: 'Bungalows and retreat dates in Calca, Sacred Valley.'
    }
  },
  {
    slug: 'sacred-valley',
    label: 'Sacred Valley',
    title: 'Sacred Valley',
    description:
      'Calca and the Urubamba valley: the place itself, its people and its rhythms, from people who live and work here year round.',
    intro:
      'Calca and the wider Urubamba valley. The place itself, its people, its weather and its rhythms, from people who are here year round.',
    cta: {
      href: '/about',
      label: 'why Ayni is rooted here',
      blurb: 'The collective grew out of this valley. Here is the longer story.'
    }
  }
];

/** @type {Map<string, Topic>} */
export const TOPIC_BY_SLUG = new Map(TOPICS.map((t) => [t.slug, t]));

/** Every valid topic slug, for validation and for prerender `entries()`. */
export const TOPIC_SLUGS = TOPICS.map((t) => t.slug);

/**
 * @param {unknown} value
 * @returns {boolean} true when `value` names a known cluster.
 */
export function isTopicSlug(value) {
  return typeof value === 'string' && TOPIC_BY_SLUG.has(value);
}
