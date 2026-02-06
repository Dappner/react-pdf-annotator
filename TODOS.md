# TODOs

## PdfHighlighter.tsx

- **Replace DOM selectors with state checks in mouse handlers**: `onMouseDown` (line ~727) and `onMouseUp` (line ~691) use DOM selectors (`#PdfHighlighter__tip-container`, `.Highlight`) to skip events. Should use component state (`tipMode`, `isHighlightHovered`) instead to avoid coupling to DOM structure.
