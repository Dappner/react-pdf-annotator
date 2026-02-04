import type { IHighlight } from "../react-pdf-highlighter";

interface HighlightListProps {
  highlights: IHighlight[];
  onJumpTo: (highlight: IHighlight) => void;
  onLogPayload: () => void;
  onClearAll: () => void;
}

export function HighlightList({ highlights, onJumpTo, onLogPayload, onClearAll }: HighlightListProps) {
  const sortedHighlights = [...highlights].sort((a, b) => {
    const pageA = a.position.pageNumber ?? 0;
    const pageB = b.position.pageNumber ?? 0;
    if (pageA !== pageB) {
      return pageA - pageB;
    }
    const rectA = a.position.boundingRect;
    const rectB = b.position.boundingRect;
    const topA = "top" in rectA ? rectA.top : rectA.y1;
    const topB = "top" in rectB ? rectB.top : rectB.y1;
    return (topA ?? 0) - (topB ?? 0);
  });

  return (
    <div className="highlight-list">
      <h2>Saved Highlights ({highlights.length})</h2>
      {highlights.length === 0 ? (
        <p className="empty-state">No highlights yet. Open the PDF and select text to create highlights.</p>
      ) : (
        <ul>
          {sortedHighlights.map((highlight) => {
            const { boundingRect, pageNumber } = highlight.position;
            const rawY =
              "top" in boundingRect ? boundingRect.top : boundingRect.y1;
            const rawX =
              "left" in boundingRect ? boundingRect.left : boundingRect.x1;
            const y = Number.isFinite(rawY) ? Math.round(rawY) : "—";
            const x = Number.isFinite(rawX) ? Math.round(rawX) : "—";

            return (
            <li key={highlight.id} className="highlight-item">
              <blockquote>{highlight.content?.text?.slice(0, 100)}...</blockquote>
              <p className="highlight-meta">
                Page {pageNumber} • y {y} • x {x}
              </p>
              {highlight.comment && (
                <p className="highlight-comment">💬 {highlight.comment}</p>
              )}
              <button
                type="button"
                className="btn btn-small"
                onClick={() => onJumpTo(highlight)}
              >
                Jump to highlight
              </button>
            </li>
            );
          })}
        </ul>
      )}
      {highlights.length > 0 && (
        <div className="highlight-actions">
          <button
            type="button"
            className="btn btn-small"
            onClick={onLogPayload}
          >
            Log Payload
          </button>
          <button type="button" className="btn btn-danger" onClick={onClearAll}>
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
