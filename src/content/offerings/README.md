# Offerings

One folder per offering: `<slug>/index.md`, frontmatter only.

There is no body. Everything the page shows is a frontmatter field, so words
written below the `---` are never rendered — `npm run offerings:check` warns
about that specifically.

The photograph does **not** live here (unlike a blog post, whose images are
colocated and processed at build time). Offering covers are processed by hand
into `static/images/offerings/`:

```bash
scripts/images.sh <the-photo> <slug> static/images/offerings
```

`.agents/skills/publish-offering/SKILL.md` walks through the whole thing and
is the intended way to add one. The field contract is
`src/lib/offerings/schema.js`; the category list is
`src/content/offeringCategories.js`.

This file exists so the folder does — git does not track empty directories,
and `import.meta.glob` needs the path to be real.
