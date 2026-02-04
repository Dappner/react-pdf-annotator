# AGENTS.md

This repo is a TypeScript React library for PDF annotation/highlighting built on PDF.js.

## Focus areas
- The public API lives in `src/index.ts`; edit source files in `src/` and `src/style/`.
- `dist/` is build output; do not edit it directly.
- The `example/` app is for demos only; avoid changing it unless requested.

## Common tasks
- Build the library: `npm run build`.
- Type-check: `npm run compile`.
- Lint/format: `npm run lint` and `npm run format`.
- E2E demo tests (Playwright): `npm run test:e2e`.

## Architecture notes
- `PdfLoader` wraps PDF.js document loading and worker configuration.
- `PdfHighlighter` owns PDF.js `PDFViewer`, listens for selection/scroll events, and renders per-page highlight layers.
- Coordinate conversions live in `src/lib/coordinates.ts` and are used by the highlight pipeline.
