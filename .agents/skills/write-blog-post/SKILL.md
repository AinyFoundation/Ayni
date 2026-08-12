---
name: write-blog-post
description: Write a blog post for Ayni Sanctuary's journal. Two paths: interview the author (one question at a time) OR process content they paste. Always voice-checked, never fabricated. Use when someone wants to publish, add a post, or write a blog entry.
---

# Write a blog post

One post, one folder. Output: `src/content/blog/<slug>/index.md`

## Two paths

### Path A: User pastes content

If the user gives you a draft, text, or raw notes:

1. **Read it.** Understand what they're saying and what's missing.
2. **Report back with:**
   - What you understood (1-2 sentences)
   - What's missing for a good post (be specific)
   - **3 questions max** to fill the gaps
3. **Wait for answers.** Then draft.
4. **Show the draft.** Offer **one** revision pass: "Is anything here something you didn't say?"

Their sentences survive. You edit, not rewrite.

### Path B: Interview (no content provided)

Ask **one question at a time.** A wall of questions gets one-word answers.

1. **What happened?** The actual thing: the morning, the ceremony, the harvest. Let them ramble.
2. **What's the one detail only you would know?** A number, a name, a smell, a mistake.
3. **Images.** Which files, what's in each. You need their alt text, not your guess.
4. **Topic.** Must be one of: `ceremony`, `the-land`, `farm-and-food`, `retreats`, `sacred-valley`
5. **Anything you don't want in there.** People often have a reason.

## Before drafting

Check the material. Ask up to **3 sharpening questions** where it's thin:

- Nothing first-hand? Ask what they saw.
- No specifics? Ask for names, numbers, dates, weather.
- Generic title? "Benefits of ceremony" is a category, not a title.
- Duplicates an existing post? Say which one, ask what's different.

If they decline to add more, write the shorter honest post. **Do not fill the gap yourself.**

## Draft

700-1400 words. Shorter is fine when material is short.

- **Open cold on a concrete moment.** First sentence = something that happened.
- **2-4 `##` sections.** Headings as sentences, not keyword slots.
- **Take a position.** Hedging everywhere = nobody with an opinion wrote this.
- **Quiet close.** Image or plain statement. No summary, no "in conclusion".

## Voice rules

- First person: "we" for sanctuary, "I" for one person's story.
- Contractions on. "Don't" not "do not".
- Concrete over abstract. "The road closed for three days" not "the transformative power".
- Quechua/Spanish terms stay untranslated with short gloss on first use.
- **No superlatives about ourselves.** Not "world-class", not "unique".

**Banned words:** delve, tapestry, pivotal, moreover, furthermore, in conclusion, it's worth noting, testament to, navigate the landscape, unlock the, elevate your, seamless, robust, leverage, in today's world, not only, a myriad of, when it comes to, dive into, game changer, ever-evolving, landscape of

**Never open with:** "In this post we'll explore...", "This article examines...", "Have you ever wondered...", "Imagine a place where..."

**Never claim outcomes.** Describe what happens, never what it will do to someone.

## Promotion (minimal)

- **One** in-body link to the main site, if genuinely relevant. Anchor text = real noun phrase.
- **One** link to the post's topic pillar page.
- Zero is fine. A post with no CTA is a normal, correct outcome.

## Write the files

```
src/content/blog/<slug>/
  index.md          frontmatter + body
  <image>.jpg       colocated, kebab-case names
```

**Frontmatter:**
```yaml
---
title: What the rain does to the road
description: 110-160 characters. Meta description, not a summary.
date: 2026-02-18
topic: the-land
tags: [weather, calca]
cover: flooded-track.jpg
coverAlt: A dirt track with water running across it.
author: ayni
draft: true
---
```

- Slug: lowercase kebab-case, 3-4 words, from title.
- Images: copy into folder, rename descriptively (`IMG_4821.jpg` → `stone-path.jpg`).
- Alt text: describe what's in the frame for someone who can't see it.

## Check, then hand back

```bash
npm run blog:check -- <slug>
npm run blog:images && npm run build
```

Show the draft. Offer one revision pass. Ask: **"Is anything here something you didn't say?"**

## What this skill will not do

- Publish. `draft: false` and committing is the author's decision.
- Invent experience, quotes, numbers, names, or dates.
- Write about ceremony or medicine in a way that promises a result.
- Add tracking, embeds, popups, or newsletter capture. Constitutional rule.
