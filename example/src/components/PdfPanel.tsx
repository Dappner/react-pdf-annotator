import { useRef, useState } from "react";
import { PdfHighlighter, PdfLoader } from "../react-pdf-highlighter";
import type {
  HighlightPayload,
  IHighlight,
  NewHighlight,
} from "../react-pdf-highlighter";
import { Spinner } from "../Spinner";
import { useZoom } from "../react-pdf-highlighter";
import { HighlightActionBar, SelectionActionBar } from "./ActionBar";
import { CommentDialog } from "./CommentDialog";

interface PdfPanelProps {
  url: string;
  highlights: IHighlight[];
  editingHighlight: IHighlight | null;
  scrollRef: (scrollTo: (highlight: IHighlight) => void) => void;
  onAddHighlight: (highlight: NewHighlight) => IHighlight;
  onUpdateHighlight: (id: string, update: Partial<HighlightPayload>) => void;
  onDeleteHighlight: (id: string) => void;
  onOpenCommentDialog: (highlight: IHighlight) => void;
  onSaveComment: (highlightId: string, comment: string) => void;
  onCancelComment: () => void;
  disallowOverlappingHighlights: boolean;
  onOverlap: () => void;
  onClose: () => void;
}

export function PdfPanel({
  url,
  highlights,
  editingHighlight,
  scrollRef,
  onAddHighlight,
  onUpdateHighlight,
  onDeleteHighlight,
  onOpenCommentDialog,
  onSaveComment,
  onCancelComment,
  disallowOverlappingHighlights,
  onOverlap,
  onClose,
}: PdfPanelProps) {
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const [hoveredHighlightId, setHoveredHighlightId] = useState<string | null>(
    null,
  );
  const { pdfScaleValue, zoomLabel, zoomIn, zoomOut, fitWidth } = useZoom(pdfContainerRef, true);

  return (
    <>
      <div className="panel-overlay" onClick={onClose} />
      <div className="slide-panel">
        <div className="panel-header">
          <div className="panel-title">PDF Viewer</div>
          <div className="panel-controls">
            <button
              type="button"
              className="btn btn-small"
              onClick={fitWidth}
              title="Fit to width"
            >
              Fit Width
            </button>
            <span className="zoom-level">{zoomLabel}</span>
            <button type="button" className="btn btn-small" onClick={zoomOut}>
              −
            </button>
            <button type="button" className="btn btn-small" onClick={zoomIn}>
              +
            </button>
            <button
              type="button"
              className="btn btn-close"
              onClick={onClose}
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>
        <div className="panel-content" ref={pdfContainerRef}>
          <PdfLoader url={url} beforeLoad={<Spinner />}>
            {(pdfDocument) => (
              <PdfHighlighter
                pdfDocument={pdfDocument}
                pdfScaleValue={pdfScaleValue}
                debug
                enableAreaSelection={(event) => event.altKey}
                onScrollChange={() => {}}
                scrollRef={scrollRef}
                disallowOverlappingHighlights={disallowOverlappingHighlights}
                onOverlap={onOverlap}
                onSelectionFinished={(position, content, hideTipAndSelection) => (
                  <SelectionActionBar
                    position={position}
                    content={content}
                    onHighlightCreated={onAddHighlight}
                    onOpenCommentDialog={onOpenCommentDialog}
                    onDelete={(id) => {
                      onDeleteHighlight(id);
                      hideTipAndSelection();
                    }}
                  />
                )}
                renderPopup={(highlight) => (
                  <HighlightActionBar
                    highlight={highlight}
                    onEdit={() => onOpenCommentDialog(highlight)}
                    onDelete={() => onDeleteHighlight(highlight.id)}
                  />
                )}
                onHighlightHover={(highlight) =>
                  setHoveredHighlightId(highlight.id)
                }
                onHighlightBlur={() => setHoveredHighlightId(null)}
                onUpdate={(id, update) => onUpdateHighlight(id, update)}
                highlights={highlights}
              />
            )}
          </PdfLoader>
        </div>
        <div className="panel-footer">
          <span className="hint">
            💡 Ctrl+Scroll to zoom • Select text to highlight • Alt+drag for area selection
          </span>
          <span className="hint">
            Hovered highlight: {hoveredHighlightId ?? "—"}
          </span>
        </div>

        {editingHighlight && (
          <CommentDialog
            highlight={editingHighlight}
            onSave={(comment) => onSaveComment(editingHighlight.id, comment)}
            onCancel={onCancelComment}
          />
        )}
      </div>
    </>
  );
}
