# Stage 6 report — Design Studio canvas

**Date:** 2026-10-27 (America/Los_Angeles)  
**Branch:** `cursor/stage-6-design-studio-ba6a`  
**Base:** Stage 5 accepted (owner-fulfilled POD; no Printful)

## Library choice

**Fabric.js** (not Konva): mature object model for image + text editing, solid touch transforms, JSON serialize for guest sessions, and straightforward PNG export multipliers for print-ready output.

## What shipped

| Area | Notes |
|---|---|
| `/design/` studio | Product / color / front-back, upload PNG/JPG/SVG, text, color, layers, undo/redo, mockup stage |
| Print boxes | Inches → 300 DPI export via `displayScale` (edit small, export full) in `design-studio.json` |
| Preflight | Soft DPI warning (~150), JPG transparency note, 8MB cap |
| Export API | `POST /api/designs` validates attestation + objects, server price from catalog variant, stores design meta in D1 when available |
| Cart | Lines support `designId`; checkout metadata carries it |
| IP | Attestation checkbox + Terms link + Contact report/takedown |
| Guest session | `lialvaro_design_guest` cookie/local id on save |

## Gate adaptations (owner locks)

BUILD_PLAN gate mentioned “provider draft order.” **Struck with Stage 5 locks:** export → cart → Stripe → **owner production queue** (not Printful EDM/API).

## Still deferred

- R2 binary storage for print PNGs (meta/canvas JSON saved now; PNG downloads client-side)
- Account attach of guest designs on login (Stage 7)
- Full Playwright design→checkout e2e in CI

## Owner phone test script

See `docs/stage-reports/stage-6-phone-test.md`.

## STOP

Stage 6 ready for owner review on `/design/`.
