# Where posts send readers

The map lives in `src/content/topics.js` as each cluster's `cta` field. This file
explains the rules around it.

| Cluster | Destination | Anchor text |
|---|---|---|
| `ceremony` | `/sanctuary#ceremonies` | ceremonies at the sanctuary |
| `the-land` | `/wings/energy` | the regenerative work in Calca |
| `farm-and-food` | `/sanctuary#restaurant` | the kitchen at the sanctuary |
| `retreats` | `/sanctuary#stay` | staying at the sanctuary |
| `sacred-valley` | `/about` | why Ayni is rooted here |

## None of these pages exist yet

`/sanctuary`, `/wings/energy` and `/about` are linked from the site's own
navigation and have no route in `src/routes/`. Until they do:

- `src/lib/blog/cta.ts` checks each destination against the real route manifest
  and returns `null` when it does not resolve. **No CTA card renders.** That is
  correct behaviour, not a bug.
- `scripts/blog-check.mjs` warns about it, and hard-fails any in-body link or
  `cta:` override that does not resolve.

Do not route around this. A call to action that 404s wastes the click and teaches
crawlers the site is broken, which costs more than the missing link gains.

## The budget for one post

- **One** in-body link to the main site. It goes in a sentence that was already
  heading there, with a real noun phrase as anchor text.
- **One** end-of-post CTA card, rendered automatically from `topic`.
- **One** link to the post's own pillar page.
- **One or two** links to sibling posts in the same cluster.

`blog-check.mjs` warns above two in-body site links.

## The links that actually pay

The pillar and sibling links, not the sanctuary link. A cluster where every post
links to its hub and the hub links back to every post is what builds topical
authority, and it is the structure AI search engines cite from. Twenty
interconnected posts outrank one excellent isolated one.

The sanctuary link converts the reader who was already going to convert. The
cluster structure is what brings readers in the first place.

## When to use none

- The post has nothing to do with any destination. A note about February weather
  does not need to sell a retreat.
- You already used the in-body link and the automatic card covers it.
- The only relevant destination does not exist yet.

Zero calls to action is a normal outcome. A post that reads as an ad stops being
read, and then none of this matters.

## Anchor text

| No | Yes |
|---|---|
| click here | the bungalows in Calca |
| learn more | how a ceremony night is held |
| our retreats page | the retreat dates for this season |
| find out more about Ayni Sanctuary | why we plant on the upper terrace |

Anchor text is a description of the destination, written as though the link were
not there.
