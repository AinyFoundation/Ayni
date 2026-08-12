# Frontmatter contract

The authoritative version is `src/lib/blog/schema.js`, which both the build and
`scripts/blog-check.mjs` run against. This file explains it.

```yaml
---
title: What the rain does to the road
description: Three days of February rain closes the track above Calca every year. What that means for a retreat week, and why we plan around it rather than against it.
date: 2026-02-18
updated: 2026-03-02
topic: the-land
tags:
  - weather
  - calca
cover: flooded-track.jpg
coverAlt: A dirt track above Calca with water running across it, hillside rising on the left.
author: ayni
draft: false
cta: /sanctuary#stay
---
```

## Fields

| Field | Required | Rule |
|---|---|---|
| `title` | yes | Becomes the `<h1>` and `og:title`. Over 60 characters gets cut off in search results (warning). |
| `description` | yes | **110 to 160 characters.** Over 160 is an error, under 110 a warning. |
| `date` | yes | `YYYY-MM-DD`. Quoted or unquoted, both work. |
| `updated` | no | `YYYY-MM-DD`, on or after `date`. Drives `dateModified` and sitemap `lastmod`. |
| `topic` | yes | One of: `ceremony`, `the-land`, `farm-and-food`, `retreats`, `sacred-valley`. |
| `tags` | no | Free-form list. Drives related-post matching, so an empty list means no related block. |
| `cover` | no | Bare filename, colocated with `index.md`. No paths. |
| `coverAlt` | with `cover` | Required whenever `cover` is set. |
| `author` | yes | A key from `src/content/authors.js`. Defaults to `ayni`. |
| `draft` | no | `true` hides the post from the index, both feeds, the sitemap and the build entirely. Defaults to `false`. |
| `cta` | no | Site-relative path overriding the cluster's default destination. Must resolve to a real route. |

## The description is not a summary

It is the meta description, the Open Graph description, the RSS `<description>`
and the card excerpt. One string, four jobs, all of them read by someone deciding
whether to click.

Write it as the answer to "why would I read this", not as a précis. It should be
able to stand alone in a search result with no title above it.

110 to 160 characters is not arbitrary: shorter wastes the space search engines
give you, longer gets truncated mid-sentence.

## Slug

The directory name is the URL. `src/content/blog/what-rain-does/` serves at
`/blog/what-rain-does`.

Lowercase kebab-case, three or four words, derived from the title but shorter.
It never changes after publication, because changing it breaks every link and
every feed entry that already went out.

## Images

Every image lives in the post folder beside `index.md`, referenced by bare
filename:

```markdown
![A dirt track with water running across it.](flooded-track.jpg "The track above Calca, February.")
```

`npm run blog:images` turns each one into AVIF, WebP and JPEG at four widths with
a blur placeholder, and the renderer emits a `<picture>` with intrinsic dimensions.
The author does nothing except drop the file in and name it well.

Sources stay in `src/content/blog/`. Derivatives land in `static/_blog/` and are
gitignored, because they are build output.
