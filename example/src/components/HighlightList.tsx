import type { IHighlight } from "../react-pdf-highlighter";

interface HighlightListProps {
  highlights: IHighlight[];
  onJumpTo: (highlight: IHighlight) => void;
  onLogPayload: () => void;
  onClearAll: () => void;
}

export function HighlightList({ highlights, onJumpTo, onLogPayload, onClearAll }: HighlightListProps) {
  return (
    <div className="highlight-list">
      <h2>Saved Highlights ({highlights.length})</h2>
      {highlights.length === 0 ? (
        <p className="empty-state">No highlights yet. Open the PDF and select text to create highlights.</p>
      ) : (
        <ul>
          {highlights.map((highlight) => (
            <li key={highlight.id} className="highlight-item">
              <blockquote>{highlight.content?.text?.slice(0, 100)}...</blockquote>
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
          ))}
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
