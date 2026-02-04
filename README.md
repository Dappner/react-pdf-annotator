# react-pdf-highlighter

Set of React components for PDF annotation.

> **Note:** This is a fork of [agentcooper/react-pdf-highlighter](https://github.com/agentcooper/react-pdf-highlighter) with significant UX improvements.

## Features

- Built on top of PDF.js
- Text and image highlights
- Popover text for highlights
- Scroll to highlights

## Fork Improvements

This fork includes the following enhancements:

### Highlight Interaction
- **Hover-based action bar**: Shows on hover with 200ms delay (prevents flickering), instead of right-click
- **Smooth hover transitions**: 150ms grace period allows mouse to move from highlight to action bar
- **Click protection**: Clicking action bar buttons no longer dismisses the popup

### Selection Flow
- **Mouseup-based selection**: Toolbar appears only after releasing mouse, not while dragging
- **Morphing toolbar**: After saving, toolbar transitions from "save mode" to "edit mode"
- **No double-yellow**: Browser selection is cleared on save to prevent color stacking

### Positioning
- **Centered popups**: Action bars are horizontally centered above highlights
- **Smart clamping**: Popups stay within page bounds while maintaining optimal position

### Visual
- **Better highlight color**: More vibrant yellow (`rgba(255, 212, 0, 0.4)`)
- **Hover feedback**: Highlights brighten slightly on hover

### New Props
| Prop | Description |
|------|-------------|
| `renderPopup` | Simpler alternative to `highlightTransform` for hover action bars |
| `onTextLayerReady` | Callback when a page's text layer is rendered |
| `onDocumentReady` | Callback when document is ready |
| `forceRenderOnLoad` | Force re-render highlights when all pages loaded |
| `onHighlightHover` | Callback when a highlight is hovered |
| `onHighlightBlur` | Callback when a highlight loses hover |
| `disallowOverlappingHighlights` | Prevent creating overlapping text highlights on the same line |
| `onOverlap` | Callback fired when a selection overlaps an existing highlight |

## Install

```bash
npm install react-pdf-highlighter
```

## Importing CSS

```tsx
import "react-pdf-highlighter/dist/style.css";
```

## Example

```bash
npm install
npm start
```

The example demonstrates:
- Slide-over panel pattern
- Zoom controls (Ctrl+scroll or buttons)
- Morphing toolbar (save → edit)
- Comment dialog modal
- In-memory highlight persistence

## Basic Usage

```tsx
import { PdfHighlighter, PdfLoader } from "react-pdf-highlighter";
import "react-pdf-highlighter/dist/style.css";

<PdfLoader url={pdfUrl} beforeLoad={<Spinner />}>
  {(pdfDocument) => (
    <PdfHighlighter
      pdfDocument={pdfDocument}
      enableAreaSelection={(event) => event.altKey}
      onScrollChange={() => {}}
      scrollRef={(scrollTo) => { /* store scrollTo */ }}
      onSelectionFinished={(position, content, hideTipAndSelection, transformSelection) => (
        <MySelectionToolbar
          onSave={() => {
            saveHighlight({ position, content });
            hideTipAndSelection();
          }}
        />
      )}
      renderPopup={(highlight) => (
        <MyActionBar highlight={highlight} />
      )}
      highlights={highlights}
    />
  )}
</PdfLoader>
```

## useHighlights Helper

`useHighlights` is an optional convenience hook for managing highlight state while keeping your data source external (React Query, Redux, etc.).

```tsx
import { useState } from "react";
import { useHighlights } from "react-pdf-highlighter";

const [highlights, setHighlights] = useState<IHighlight[]>([]);
const {
  addHighlight,
  updateHighlight,
  deleteHighlight,
  saveComment,
} = useHighlights({
  highlights,
  setHighlights,
});
```

This pattern lets you merge/split your own persistence models in `setHighlights` and rehydrate via async fetches.

## useZoom Helper

`useZoom` provides a small controller for zooming the PDF viewer (buttons + ctrl/cmd + wheel).

```tsx
import { useRef } from "react";
import { useZoom } from "react-pdf-highlighter";

const containerRef = useRef<HTMLDivElement>(null);
const { pdfScaleValue, zoomLabel, zoomIn, zoomOut, fitWidth } = useZoom(
  containerRef,
  true,
);
```

## How It Works (Library)

### High-level flow
- `PdfLoader` loads a `PDFDocumentProxy` using PDF.js and hands it to your render prop.
- `PdfHighlighter` owns a PDF.js `PDFViewer`, attaches selection/scroll listeners, and renders highlights into a per-page overlay layer.
- Text selections call `onSelectionFinished` with a `ScaledPosition` and text content; area selections are handled by `MouseSelection` and yield image content.
- Highlights are rendered via `highlightTransform` (custom) or the default transform, which chooses `Highlight` for text or `AreaHighlight` for images and can show a popup via `renderPopup`.

### Data model and coordinates
- `ScaledPosition` is stored in PDF/viewport-independent units (optionally `usePdfCoordinates`).
- `Position` is viewport pixels used for rendering. `scaledToViewport` and `viewportToScaled` live in `src/lib/coordinates.ts`.
- `IHighlight` is the base interface for highlight objects; `HighlightHooks` exposes `onCreate`, `onUpdate`, and `onDelete`.

### Project layout (library)
- `src/index.ts` is the public entry point; it re-exports components, types, and the global CSS.
- `src/components/` contains `PdfHighlighter`, `PdfLoader`, and the overlay UI (`Highlight`, `AreaHighlight`, `TipContainer`).
- `src/lib/` contains PDF.js DOM helpers, coordinate conversions, and geometry utilities.
- `src/style/` holds CSS modules plus `index.css` which imports the PDF.js viewer styles.

### Build outputs
- Vite builds the package and emits JS + CSS into `dist/`.
- Types are emitted via `vite-plugin-dts` and exposed at `dist/index.d.ts`.
- The published package exposes `dist/style.css` for styling.

## API Reference

See [`./example/src/App.tsx`](./example/src/App.tsx) for a complete implementation example.

## API Improvement Ideas (Future)

These are optional, backward-compatible ideas that could simplify usage and improve extensibility:

- **Decouple UI from selection**: make `onSelectionFinished` return data/payload, with an optional `renderSelection` for UI.
- **Consolidate highlight types**: collapse `HighlightPayload`/`HighlightBase`/`IHighlight` into a clearer, generic model (typed `meta`).
- **Unified PDF.js options**: accept a single `pdfjsOptions` object (worker/cMap/viewer) to reduce prop surface area.
- **Public coordinate helpers**: export `scaledToViewport`/`viewportToScaled` from the public API for consumers.

## License

MIT
