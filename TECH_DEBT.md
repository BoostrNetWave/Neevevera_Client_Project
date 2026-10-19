# Tech Debt Register — Neevevera Pvt. Ltd.

Tracked architectural decisions deferred in favour of a faster working implementation.
Each entry records: what was decided, why it was deferred, and what "done" looks like.

---

## TD-001 — Gallery: ObjectId Reference to MediaAsset (Option B)

**Status:** Open  
**Priority:** High — closes a structural inconsistency that will grow over time  
**Logged:** 2026-10-06  
**Introduced by:** Gallery CMS implementation (Phase 3)

### What was deferred

`GalleryItem` stores `imageUrl` and `publicId` as plain string copies from the
Cloudinary upload response.  It has no foreign-key relationship to `MediaAsset`.

Every other content model in the project (`Service`, `Project`, `TeamMember`, etc.)
does NOT store a copied URL string — they pick a URL through the shared MediaLibrary
and rely on the asset being present in Cloudinary.  Gallery is the one exception.

### What was shipped instead (Option A hotfix)

`gallery.controller.js` now calls `claimAsset(publicId)` on create and
`releaseAsset(publicId)` on delete/image-swap.  This keeps `MediaAsset.usageCount`
accurate so the orphan-cleanup job doesn't delete Cloudinary assets that Gallery
is actively referencing.

A one-time backfill script (`server/scripts/backfill-gallery-usage.js`) repairs
existing records created before the hotfix.

### Why Option A is not sufficient long-term

Option A is a string-matching patch: every future write path that creates or
deletes a GalleryItem (bulk upload, import, any admin API extension) must
manually remember to call `claimAsset`/`releaseAsset` or the leak reopens.
There is no compile-time or schema-level enforcement — it is a convention,
not a constraint.

### What Option B looks like

1. **Schema change** — Add to `GalleryItem`:
   ```js
   mediaAsset: { type: mongoose.Schema.Types.ObjectId, ref: 'MediaAsset', required: true }
   ```
   Keep `imageUrl` as a derived virtual (or denormalised string populated on save
   from the referenced asset's `url`) so the frontend API response doesn't change.

2. **Controller change** — `createGalleryItem` looks up the MediaAsset by `publicId`,
   saves its `_id` as `mediaAsset`, and increments `usageCount` via the ObjectId
   reference (not a string search).  `deleteGalleryItem` decrements via the same ref.

3. **Orphan-cleanup hardening** — The cleanup job can then do a `$lookup`-style
   cross-collection check to confirm a MediaAsset is truly unreferenced before
   deleting, rather than relying entirely on the `usageCount` integer being accurate.

4. **Migration** — A one-time script populates `mediaAsset` ObjectId refs for all
   existing `GalleryItem` records by matching `publicId` to `MediaAsset.publicId`.

### Definition of done

- `GalleryItem.mediaAsset` is a populated ObjectId ref to `MediaAsset`
- `gallery.controller.js` has no string-based `publicId` lookups for usageCount
- `claimAsset`/`releaseAsset` helpers are removed (no longer needed)
- Migration script run against staging, verified, then production
- `backfill-gallery-usage.js` script archived/removed (superseded)

---

## TD-002 — Search: Relevance Ranking

**Status:** Open  
**Priority:** Medium — functional today, but rough  
**Logged:** 2026-10-06  
**Introduced by:** Phase 2.5 search implementation (scope change, not in original PRD)

### What was deferred

`search.controller.js` uses `$regex` field-match across Projects, Services, and
Blog.  Results are sorted alphabetically by title — not by relevance.

A title match and a body-text match score identically.  There is no boost for
exact matches, recency, or content type.  `limit(10)` per collection is hardcoded
with no pagination across the combined result set.

### What done looks like

**Option A (short term, no infra change):**
Post-process results in the controller: score each result by match location
(title match = 3pts, excerpt/description = 2pts, body/content = 1pt), sort by
score descending, then by recency as tiebreaker.

**Option B (production-grade):**
Enable MongoDB Atlas Search (Lucene-based) with a search index on the three
collections.  Replace `$regex` queries with `$search` aggregation stage.
Supports fuzzy matching, field weighting, and highlight extraction out of the box.
Requires Atlas M10+ cluster tier.

### Current status note

Search was not in Phase 2 PRD scope — it was built opportunistically.  The `⚠️ Partial`
label is accurate: it works for simple queries but should not be described as
"full-text search" in any external documentation or product spec until Option A or B
above is implemented.

**Sub-services visibility limitation (Logged: 2026-10-15):**  
`search.controller.js` only matches against `Service.title` and `Service.description`.
It does not inspect nested `sections[].title` or `sections[].services[].title`.
Queries for specific sub-services (e.g. "Villas", "Waterproofing", "AAC Block Masonry")
will not return the parent service vertical in search results until the query
is extended to traverse nested sub-service fields.

---

## CR-001 — Client-Requested Change: 6-Vertical Services Restructuring

**Status:** Implemented  
**Date Logged:** 2026-10-15  
**Requested by:** Client  
**Aligned PRD Reference:** PRD §4.3 (All Services Displayed)

### Context & Decision
PRD Section 4.3 enumerates ~31 distinct services. The client requested grouping these into 6 core corporate verticals (Construction, Building Repair & Maintenance, Design & Planning, Interior & Exterior Solutions, Project Management Consultancy, and Additional Services/Platform Features) using a two-level nested operational structure (Vertical &rarr; Sections &rarr; Sub-Services).

### Implementation Specifics
- Hierarchical schema in `server/src/models/Service.js` (`sections[]` containing `services[]`).
- Admin CMS editor in `client/src/pages/admin/Services.jsx` (`SectionsEditor`) providing full CRUD on sections, sub-services, and order, with MediaPicker image reuse and 409 concurrency checks.
- Media usage tracking via `server/src/utils/serviceMedia.js` (`collectServiceImages`) ensuring sub-service images are tracked in `MediaAsset.usageCount`.
- PRD §4.3.1 fields (`benefits`, `priceNote`, `legalNote`) retained in schema, editable in CMS, and rendered in a compact guarantee block on the detail page.

---

## TD-003 — Applications: Cross-Job Aggregate Endpoint

**Status:** Open  
**Priority:** Low — deferred intentionally, not an oversight  
**Logged:** 2026-10-06

### What was deferred

The Applications admin page (`/admin/applications`) fetches the job list first,
then fetches applications per job on selection.  The Dashboard stat card counts
total applications by calling `GET /api/careers/admin/list` then looping over
each job's `/applications` endpoint — N+1 requests.

### Why it was deferred

The N+1 only fires once on Dashboard load, with the results cached in component
state for the session.  With fewer than ~20 active jobs this is negligible.
Building an aggregate endpoint now adds complexity for a benefit that isn't yet
measurable.

### What done looks like

`GET /api/careers/applications/all` — returns all applications across all jobs
in a single query using MongoDB's `$unwind` + `$lookup` aggregation.  Supports
filter by `status`, pagination, and sorting by `appliedAt`.  Dashboard stat
becomes a single `count`-only request.  Build when job count exceeds ~20 or
when filtering across jobs becomes a real admin need.
