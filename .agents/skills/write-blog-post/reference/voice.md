# Voice

How a note from Ayni Sanctuary sounds, and the rules that keep it sounding
like a person wrote it.

Everything marked **enforced** is checked by `scripts/blog-check.mjs`. The rest
is judgement, and judgement is why a human reads the draft before it ships.

## The voice

Plain, specific, unhurried. Somebody who lives here telling you what happened,
not a brand talking about itself.

- **First person is fine.** "We" for the sanctuary, "I" when one person is telling
  the story. Pick one and stay in it.
- **Contractions on.** "Don't", "it's", "we've". Their absence is stiff and reads
  as translated.
- **Concrete over abstract.** Not "the transformative power of the land". The road
  closed for three days. The fire was lit at five.
- **Take a side.** If you think the afternoon ceremonies work better than the
  morning ones, say so. Hedging on every clause is the loudest tell there is.
- **Quechua and Spanish terms stay untranslated** when they are the right word,
  with a short gloss on first use if a visitor would not know it. *Ayni*, *maloca*,
  *chakra*, *temazcal*. Check `CONTEXT.md` before using one.
- **No superlatives about ourselves.** Not "world-class", not "unique", not
  "unforgettable". Describe the thing and let the reader decide.

## Never claim an outcome

This matters more than any style rule. Ceremony, plant medicine and wellness are
described by **what happens**, never by **what it will do to you**. No promise of
healing, no implied cure, no before-and-after. Report, do not prescribe. Somebody
deciding whether to come deserves an honest picture, not a brochure.

## The mechanical rules

### Punctuation

- **No em dashes or en dashes. Zero.** *(enforced)* Use a comma, a full stop, or
  parentheses. This is stricter than the evidence requires and costs nothing.
- Semicolons are allowed but rarely earn their place. A full stop usually reads
  better.
- Straight quotes in the source; the build converts them to typographic quotes.

### Words that do not appear here

*(enforced)* delve · tapestry · pivotal · moreover · furthermore · in conclusion ·
it's worth noting · testament to · navigate the landscape · unlock the · elevate
your · seamless · robust · leverage · in today's world · not only · a myriad of ·
when it comes to · dive into · game changer · ever-evolving · landscape of

The list is short on purpose. It targets the tells that still hold in 2026 rather
than every word a detector has ever flagged. If a banned word is genuinely the
right one in context, the sentence almost always improves when you rewrite around
it.

### Openers

*(enforced)* Never begin with any of these:

- "In this post we'll explore…"
- "This article examines…"
- "Have you ever wondered…"
- "Imagine a place where…"

Begin with the thing itself. The first sentence should be something that happened.

### Endings

No summary. No "in conclusion". No returning to restate the opening. No inviting
the reader to reflect on their journey. Land on an image or a plain statement and
stop.

### Structure

- **Break the rule of three.** *(partly enforced)* Three-item lists, three-clause
  sentences and three-part parallel structures everywhere is the rhythm of
  generated text. If there really are three things, three is correct. If you
  padded to three, cut to two or find a fourth.
- **Vary sentence length.** *(enforced as a warning)* At least one short sentence
  per few paragraphs. Uniform pacing is the structural tell that outlived the
  em dash.
- **Headings read as sentences or plain noun phrases.** `## What the rain does to
  the road`, not `## Rain and Road Conditions in the Sacred Valley`.
- **Heading levels never skip.** *(enforced)* `##` then `###`. The post title is
  the only `#`.
- One idea per paragraph. Two to five sentences. A single-sentence paragraph is a
  legitimate emphasis tool, used sparingly.

### The author's own words

Whatever the author said in the interview survives verbatim wherever it can. Their
phrasing is the thing that cannot be reproduced. Smooth the grammar, keep the words.

If you find yourself improving a sentence into something more polished and less
particular, stop and put theirs back.

## Images

- Alt text describes what is in the frame for someone who cannot see it.
  *(enforced: every image needs it)*
- It is not a caption and not a keyword slot. "Thatched adobe bungalows below a
  green hillside", not "Ayni Sanctuary luxury retreat accommodation Sacred Valley".
- Captions, set as the markdown title, add something the image does not say by
  itself. Where, when, who. If there is nothing to add, leave it out.

## A test that works

Read the draft aloud. Anywhere you would not say that sentence to somebody
standing next to you in the kitchen, rewrite it.
