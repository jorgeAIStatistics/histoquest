# Adding, correcting, reviewing and retiring content

Content lives in `src/content/data/*.ts` as plain typed objects, validated by the Zod schemas in `src/content/schema.ts`. Rendering and scoring never hard-code content.

## Add an item

1. Pick the objective in `src/content/curriculum.ts`. If none fits, add an objective with its guideline codes first.
2. Add the item to the matching data file with a new stable id. Question ids follow `Q-<AREA>-NNN`, card ids follow `C-<AREA>-NNN`, and you start at `version: 1`. **Never reuse an id.**
3. Cite sources by `sourceId` from `src/content/sources.ts`.
   - For a source whose `access` is `not-accessed`, give a chapter-level note ending "not page-verified". Never give page numbers or quotes; a test rejects page numbers.
   - To cite a new source, add it to the registry first, and mark `access: 'read'` only if someone actually read it.
4. Set `review: { status: 'draft' | 'author-checked', verification: '<what was checked and how>' }`.
5. Validate:
   - `CONTENT_FILE=src/content/data/<file>.ts npx vitest run src/content/check-file.test.ts` checks a single file.
   - `npm test` runs the whole bank. It checks ids, cross-references, objective coverage, balanced answer keys and near-duplicate stems.
6. Run `npm run inventory` to refresh the inventory.

Every question needs these fields:

- stem
- options, each with a rationale; or, for numeric questions, the answer, unit, aliases, tolerance, steps and common errors
- correct answer and explanation
- difficulty (an author estimate from 1 to 3)
- kind
- references and review
- an optional schematic `image` with its license and attribution

## Correct an item

- **A substantive change to the stem, answer or explanation:** increase `version`. Attempts record `qVersion`, so history stays interpretable.
- **A typo:** there is no need to bump the version.
- **Notes:** record what changed in the `review.verification` note, or in Git history.

## Review status (don't over-claim)

| Status | Meaning |
|---|---|
| `draft` | Written, not yet checked |
| `author-checked` | Checked against widely taught material by the author. Textbooks not page-verified. **All current content.** |
| `expert-reviewed` | A qualified histotechnologist, HTL(ASCP) or educator, has reviewed it. Requires `reviewer` and `reviewedOn`. A test currently fails if anything claims this; remove that assertion only once a real review process exists. |
| `retired` | Kept for history and never served. Attempts on it remain in learner data. |

A source-backed item is **not** automatically expert-reviewed. Passing software tests says nothing about scientific accuracy.

## Retire an item

Set `review.status: 'retired'` and keep the item in the file. `src/content/index.ts` filters retired items out of the bank. A session that contains a retired id shows a "no longer available, skip it" state instead of crashing.

## Images

Only original schematic SVGs are bundled (`src/art/schematics.tsx`). They are labelled "Schematic, not a micrograph" in the drawing and in the caption.

To add photomicrographs later, add an asset registry with these fields:
- source
- license
- attribution
- stain
- tissue
- verified annotations

Use only images with reuse permission, and never present generated imagery as an authentic micrograph.
