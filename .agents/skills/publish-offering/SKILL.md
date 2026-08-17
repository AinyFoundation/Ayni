---
name: publish-offering
description: Publish a ceremony, retreat, event or other offering to /offerings. Short interview, structured fields, one photograph. Use when someone wants to list an event, announce a ceremony or retreat, add a date, or put something on the offerings page.
---

# Publish an offering

One offering, one folder. Output: `src/content/offerings/<slug>/index.md`

This is **not** the blog skill. A post is prose and gets interviewed for a
story; an offering is a listing and gets asked for facts. Keep it short —
if you find yourself asking a fourth follow-up question, you are writing an
essay, not a listing.

## Ask for these

One question at a time only if something is missing. If they gave you a
poster or a message with the details in it, read it and confirm rather than
re-asking.

1. **Which category?** `ceremonies`, `retreats`, `events`, or a new one.
   A new category is a one-entry edit in `src/content/offeringCategories.js`
   (slug, label, wing hue) — offer it rather than forcing a bad fit.
2. **What is it called?** A name, not a description. Under 60 characters.
3. **When?** Start date. End date too, if it runs more than a day.
4. **Where**, if it is not at the sanctuary. Default is Calca, Sacred Valley.
5. **What does it ask?** Price, contribution, donation, free. Their words —
   write it exactly as they say it ("S/. 350", "By donation", "Free").
6. **A photograph**, and what is in it.
7. **Two or three sentences** on what it actually is.

## Do not

- **Invent a date, a price, or a place.** If they have not decided, the
  offering is not ready to publish. Say so and stop.
- **Promise an outcome.** Describe what happens, never what it will do to
  someone. This is the same rule the blog skill carries and it matters more
  here, because this page is what someone reads before deciding to come.
- **Write marketing copy.** No "transformative", no "once in a lifetime", no
  "limited spaces" urgency. The description says what it is.
- **Publish.** `draft: false` and committing is the author's decision.

## Write the files

```
src/content/offerings/<slug>/
  index.md          frontmatter only — there is no body
```

The photograph does **not** go in the content folder (unlike a blog post).
Process it first, into `static/images/offerings/`:

```bash
scripts/images.sh <the-photo> <slug> static/images/offerings
```

That prints the width and height of each file it writes. `coverWidth` and
`coverHeight` are the dimensions of the full-size one — copy them from that
output rather than guessing, because nothing else supplies them and a wrong
pair makes the card jump as the image loads.

**Frontmatter:**
```yaml
---
title: Temazcal under the full moon
category: ceremonies
dateStart: 2026-09-12
dateEnd:            # omit entirely if it is one day
location:           # omit entirely if it is at the sanctuary
price: 'S/. 120'
whatsapp:           # omit unless THIS offering takes enquiries elsewhere
instagram:          # same
coverAlt: A low domed temazcal beside a fire at dusk.
coverWidth: 1920
coverHeight: 1280
description: A sweat lodge held on the full moon, from dusk until the fire burns down. Bring water and something to sit on.
draft: true
---
```

There is nothing below the frontmatter. Anything written there is never
rendered, and `offerings:check` will warn about it.

- Slug: lowercase kebab-case, 3–4 words, from the title.
- `description`: 60–200 characters. It is the card blurb, the page standfirst
  and the meta description at once.
- Alt text: describe what is in the frame for someone who cannot see it.

## Check, then hand back

```bash
npm run offerings:check -- <slug>
npm run check && npm run build
```

Show them what it will say. Ask: **"Is any of this something you didn't tell
me?"**

## What this skill will not do

- Take a booking or hold a place. The contact row starts a conversation; the
  collective answers it.
- Add ticketing, payment, a countdown, or a spaces-remaining counter.
- Fabricate a testimonial or an attendance number.
