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
  const scrollViewerTo = useRef((highlight: IHighlight) => {});

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
          onClose={() => setIsPanelOpen(false)}
        />
      )}
    </div>
  );
}
