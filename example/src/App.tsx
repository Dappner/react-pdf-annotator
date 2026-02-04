import { useEffect, useRef, useState } from "react";
import type { IHighlight } from "./react-pdf-highlighter";
import { useHighlights } from "./react-pdf-highlighter";
import { HighlightList } from "./components/HighlightList";
import { PdfPanel } from "./components/PdfPanel";
import { PRESET_HIGHLIGHTS } from "./mock-highlights";

import "./style/App.css";
import "../../dist/style.css";

const PRIMARY_PDF_URL = "https://arxiv.org/pdf/1708.08021";

type LoadMode = "empty" | "preloaded" | "delayed";

function getInitialLoadMode(): LoadMode {
  const params = new URLSearchParams(window.location.search);
  const mode = params.get("mode");
  if (mode === "preloaded" || mode === "delayed") return mode;
  return "empty";
}

function getInitialHighlights(mode: LoadMode): IHighlight[] {
  // For "preloaded" mode, highlights are available immediately (simulates cached data)
  return mode === "preloaded" ? PRESET_HIGHLIGHTS : [];
}

export function App() {
  const initialMode = getInitialLoadMode();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [loadMode, setLoadMode] = useState<LoadMode>(initialMode);
  const [rawHighlights, setRawHighlights] = useState<IHighlight[]>(
    getInitialHighlights(initialMode)
  );
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

  // For "delayed" mode, load highlights after 700ms (simulates async fetch)
  useEffect(() => {
    if (initialMode !== "delayed") return;
    const timeout = setTimeout(() => {
      setRawHighlights(PRESET_HIGHLIGHTS);
    }, 700);
    return () => clearTimeout(timeout);
  }, [initialMode]);

  const logPayload = () => {
    console.log("=== Highlights Payload ===");
    console.log(JSON.stringify(highlights, null, 2));
    console.log("=== Raw Object ===");
    console.log(highlights);
  };

  const handleLoadModeChange = (mode: LoadMode) => {
    // Update URL to persist mode across refresh
    const url = new URL(window.location.href);
    if (mode === "empty") {
      url.searchParams.delete("mode");
    } else {
      url.searchParams.set("mode", mode);
    }
    window.history.replaceState({}, "", url.toString());

    // Reload page to simulate fresh mount with the new mode
    window.location.reload();
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
            View PDF
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

        <div className="controls">
          <span className="control-label">Load mode:</span>
          <button
            type="button"
            className={`btn btn-small ${loadMode === "empty" ? "btn-active" : ""}`}
            onClick={() => handleLoadModeChange("empty")}
          >
            Empty
          </button>
          <button
            type="button"
            className={`btn btn-small ${loadMode === "preloaded" ? "btn-active" : ""}`}
            onClick={() => handleLoadModeChange("preloaded")}
          >
            Preloaded
          </button>
          <button
            type="button"
            className={`btn btn-small ${loadMode === "delayed" ? "btn-active" : ""}`}
            onClick={() => handleLoadModeChange("delayed")}
          >
            Delayed (700ms)
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
