# AGENTS.md

## Purpose
This repository uses Codex for milestone-based implementation work.

For multi-file tasks, security-sensitive changes, cache/infrastructure resilience work, middleware changes, service worker changes, access-control updates, or tasks with 3+ distinct fixes, Codex must plan first before editing code.

## Working rules
- Make the minimum necessary change.
- Do not refactor unrelated code.
- Preserve existing behavior unless a requested fix explicitly changes behavior.
- Keep diffs small and reviewable.
- If a tiny adjacent fix is required to make the requested change compile, lint, build, or pass validation, include it and explain why.
- Prefer narrow, local edits over architectural rewrites.
- Do not silently skip requested fixes.

## Planning rule
For complex tasks, create or update `PLANS.md` before implementation.

A good plan must include:
- milestones
- fixes grouped by milestone
- files likely affected
- dependencies
- risks
- validation commands
- acceptance criteria
- stop-and-fix rule if validation fails

## Validation rule
After each milestone:
1. run the specified validation commands
2. if validation fails, fix the issues introduced by that milestone before continuing
3. summarize completed work, changed files, and validation results

## Output expectations for each milestone
Return:
- completed fixes
- files changed
- validation results
- residual risks or manual QA notes

## Repo-wide constraints
- Preserve existing API response shapes unless a requested fix explicitly changes them.
- Do not broaden permissions.
- Do not weaken validation.
- Treat access control, role changes, media deletion, middleware, caching, and public-read globals as high-sensitivity areas.
- Service worker and build-tooling changes must be minimal and coordinated with the existing build scripts.

## Access control rules
- Keep `@/access` consistent across the codebase.
- Prefer the typed/shared access implementation over duplicate or loose-typed variants.
- Access-control changes must not weaken authorization.
- Field-level role changes must be handled carefully to prevent privilege escalation.

## Cache and infrastructure resilience rules
- Cache failures must degrade gracefully and must not crash API routes.
- Redis read/write failures should be logged and treated as cache misses or non-fatal write failures unless a task explicitly says otherwise.
- Rate-limit infrastructure failures must fail open unless a task explicitly requires fail-closed behavior.
- Third-party API failures must not discard already-available local/manual data if graceful fallback is possible.

## Middleware rules
- Middleware changes must preserve request flow unless the requested fix explicitly changes behavior.
- Be cautious with IP-derived logic and header trust assumptions.
- If forwarded headers are used, document trusted proxy assumptions clearly.

## Collections / CMS rules
- Preserve collection structure unless the requested fix explicitly changes it.
- Audit-trail fields such as `uploadedBy`, `lastApprovedBy`, and similar relationship fields must only be set when the necessary authenticated user data exists.
- Media deletion permissions should remain stricter than ordinary content-edit permissions.
- Public emergency or safety-critical content must not become unavailable due to draft/edit workflow unless explicitly intended.

## Frontend / component rules
- Keep UI changes minimal unless the task explicitly requests a redesign.
- Prefer stable keys over index-based keys in mapped UI lists.
- Fix accessibility issues with the smallest safe change.
- Avoid unnecessary rerenders from unstable inline objects or unstable dependencies when a small cleanup resolves it.

## Utility / null-safety rules
- Remove unsafe non-null assertions when a small guard is sufficient.
- Prefer explicit existence checks before mutating values from `Map.get`, `.find`, `.keys().next().value`, or similar APIs.
- Safe fallbacks should be used where the requested fix specifies them.

## Service worker / build rules
- Service worker changes must preserve caching behavior unless the fix explicitly changes it.
- Avoid manual cache-version workflows when build-injected versioning is requested.
- Coordinate `public/sw.js` changes with the existing build script if version/hash injection is required.
- Cache quota failures in the service worker must be handled gracefully and logged when appropriate.

## Seed / scripting rules
- Seeding and update scripts should log per-item success/failure when requested.
- One failed seed step should not silently hide the status of other steps.
- Keep scripting changes narrow and operationally clear.

## Default validation commands
After each milestone, run:
- `pnpm lint`
- `pnpm build`

If a task specifies extra validation, run that too.
