import { useState, useRef } from "react";
import type { IHighlight } from "./react-pdf-highlighter";
import { useHighlights } from "./react-pdf-highlighter";
import { HighlightList } from "./components/HighlightList";
import { PdfPanel } from "./components/PdfPanel";

import "./style/App.css";
import "../../dist/style.css";

const PRIMARY_PDF_URL = "https://arxiv.org/pdf/1708.08021";

export function App() {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [rawHighlights, setRawHighlights] = useState<IHighlight[]>([]);
  const [disallowOverlap, setDisallowOverlap] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const scrollViewerTo = useRef((highlight: IHighlight) => {});
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    highlights,
    editingHighlight,
    setEditingHighlight,
    addHighlight,
    updateHighlight,
    deleteHighlight,
    saveComment,
    resetHighlights,
  } = useHighlights({
    highlights: rawHighlights,
    setHighlights: setRawHighlights,
  });

  const logPayload = () => {
    console.log("=== Highlights Payload ===");
    console.log(JSON.stringify(highlights, null, 2));
    console.log("=== Raw Object ===");
    console.log(highlights);
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    if (toastTimeout.current) {
      clearTimeout(toastTimeout.current);
    }
    toastTimeout.current = setTimeout(() => {
      toastTimeout.current = null;
      setToastMessage(null);
    }, 1800);
  };

  const handleJumpToHighlight = (highlight: IHighlight) => {
    setIsPanelOpen(true);
    setTimeout(() => scrollViewerTo.current(highlight), 100);
  };

  return (
    <div className="demo-container">
      <div className="main-content">
        <h1>PDF Highlighter Demo</h1>
        <p>This demo mimics a slide-over panel pattern commonly used in apps.</p>

        <div className="controls">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsPanelOpen(true)}
          >
            View PDF Fullscreen
          </button>
          <label className="toggle">
            <input
              type="checkbox"
              checked={disallowOverlap}
              onChange={(event) => setDisallowOverlap(event.target.checked)}
            />
            Disallow overlapping highlights
          </label>
        </div>

        <HighlightList
          highlights={highlights}
          onJumpTo={handleJumpToHighlight}
          onLogPayload={logPayload}
          onClearAll={resetHighlights}
        />
      </div>

      {isPanelOpen && (
        <PdfPanel
          url={PRIMARY_PDF_URL}
          highlights={highlights}
          editingHighlight={editingHighlight}
          scrollRef={(scrollTo) => {
            scrollViewerTo.current = scrollTo;
          }}
          onAddHighlight={addHighlight}
          onUpdateHighlight={(id, update) => {
            updateHighlight(id, update);
          }}
          onDeleteHighlight={deleteHighlight}
          onOpenCommentDialog={setEditingHighlight}
          onSaveComment={saveComment}
          onCancelComment={() => setEditingHighlight(null)}
          disallowOverlappingHighlights={disallowOverlap}
          onOverlap={() =>
            showToast("Overlaps an existing highlight on the same line.")
          }
          onClose={() => setIsPanelOpen(false)}
        />
      )}

      {toastMessage ? <div className="toast">{toastMessage}</div> : null}
    </div>
  );
}
