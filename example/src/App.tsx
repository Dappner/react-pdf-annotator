import React, { useState, useEffect, useCallback, useRef } from "react";

import {
  PdfHighlighter,
  PdfLoader,
} from "./react-pdf-highlighter";
import type {
  Content,
  IHighlight,
  NewHighlight,
  ScaledPosition,
} from "./react-pdf-highlighter";

import { Spinner } from "./Spinner";

import "./style/App.css";
import "../../dist/style.css";

const getNextId = () => String(Math.random()).slice(2);

// Icons as components
const CommentIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 14a2 2 0 0 0 2-2V8h-2" />
    <path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z" />
    <path d="M8 14a2 2 0 0 0 2-2V8H8" />
  </svg>
);

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
    <path d="m15 5 4 4" />
  </svg>
);

const DeleteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <path d="M3 6h18" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const PaletteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/>
    <circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/>
    <circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/>
    <circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/>
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z"/>
  </svg>
);

// Action bar popup component for existing highlights
const HighlightActionBar = ({
  highlight,
  onEdit,
  onDelete,
}: {
  highlight: IHighlight;
  onEdit: () => void;
  onDelete: () => void;
}) => (
  <div className="action-bar">
    {highlight.comment && (
      <div className="action-bar__comment">{highlight.comment}</div>
    )}
    <div className="action-bar__buttons">
      <button
        type="button"
        className="action-btn"
        onClick={onEdit}
        title={highlight.comment ? "Edit comment" : "Add comment"}
      >
        {highlight.comment ? <EditIcon /> : <CommentIcon />}
      </button>
      <button
        type="button"
        className="action-btn"
        title="Change color"
      >
        <PaletteIcon />
      </button>
      <button
        type="button"
        className="action-btn action-btn--danger"
        onClick={onDelete}
        title="Delete highlight"
      >
        <DeleteIcon />
      </button>
    </div>
  </div>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5"/>
  </svg>
);

// Wrapper component that manages morphing between selection and saved states
function SelectionActionBarWrapper({
  position,
  content,
  onHighlightCreated,
  onOpenCommentDialog,
  onDelete,
}: {
  position: ScaledPosition;
  content: { text?: string; image?: string };
  onHighlightCreated: (highlight: NewHighlight) => IHighlight;
  onOpenCommentDialog: (highlight: IHighlight) => void;
  onDelete: (id: string) => void;
}) {
  const [savedHighlight, setSavedHighlight] = useState<IHighlight | null>(null);

  const clearBrowserSelection = () => {
    window.getSelection()?.removeAllRanges();
  };

  const handleSave = () => {
    clearBrowserSelection();
    const highlight = onHighlightCreated({ content, position });
    setSavedHighlight(highlight);
  };

  const handleSaveWithComment = () => {
    clearBrowserSelection();
    const highlight = onHighlightCreated({ content, position });
    setSavedHighlight(highlight);
    onOpenCommentDialog(highlight);
  };

  // Saved state - show existing highlight toolbar
  if (savedHighlight) {
    return (
      <div className="action-bar">
        {savedHighlight.comment && (
          <div className="action-bar__comment">{savedHighlight.comment}</div>
        )}
        <div className="action-bar__buttons">
          <button
            type="button"
            className="action-btn"
            onClick={() => onOpenCommentDialog(savedHighlight)}
            title={savedHighlight.comment ? "Edit comment" : "Add comment"}
          >
            {savedHighlight.comment ? <EditIcon /> : <CommentIcon />}
          </button>
          <button
            type="button"
            className="action-btn"
            title="Change color"
          >
            <PaletteIcon />
          </button>
          <button
            type="button"
            className="action-btn action-btn--danger"
            onClick={() => onDelete(savedHighlight.id)}
            title="Delete highlight"
          >
            <DeleteIcon />
          </button>
        </div>
      </div>
    );
  }

  // Selection state - show save buttons
  return (
    <div className="action-bar">
      <div className="action-bar__buttons">
        <button
          type="button"
          className="action-btn action-btn--success"
          onClick={handleSave}
          title="Save highlight"
        >
          <CheckIcon />
        </button>
        <button
          type="button"
          className="action-btn"
          onClick={handleSaveWithComment}
          title="Save with comment"
        >
          <CommentIcon />
        </button>
      </div>
    </div>
  );
}

// Comment dialog component
function CommentDialog({
  highlight,
  onSave,
  onCancel,
}: {
  highlight: IHighlight;
  onSave: (comment: string) => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState(highlight.comment ?? "");

  return (
    <div className="dialog-overlay">
      <div className="dialog">
        <h3>{highlight.comment ? "Edit Comment" : "Add Comment"}</h3>
        <p className="dialog__quote">"{highlight.content?.text?.slice(0, 150)}..."</p>
        <textarea
          autoFocus
          placeholder="Add your comment..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="dialog__actions">
          <button type="button" className="btn" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onSave(text)}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

const PRIMARY_PDF_URL = "https://arxiv.org/pdf/1708.08021";

export function App() {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [highlights, setHighlights] = useState<Array<IHighlight>>([]);
  const [pdfScaleValue, setPdfScaleValue] = useState<string>("page-width");
  const [editingHighlight, setEditingHighlight] = useState<IHighlight | null>(null);

  const scrollViewerTo = useRef((highlight: IHighlight) => {});
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  // Handle Ctrl+scroll for zoom
  const handleWheel = useCallback((event: WheelEvent) => {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      event.stopPropagation();
      setPdfScaleValue((prev) => {
        const currentScale = prev === "page-width" ? 1 : parseFloat(prev);
        const delta = event.deltaY > 0 ? -0.1 : 0.1;
        const newScale = Math.max(0.5, Math.min(3, currentScale + delta));
        console.log("Zoom:", newScale);
        return newScale.toFixed(1);
      });
    }
  }, []);

  useEffect(() => {
    const container = pdfContainerRef.current;
    if (container && isPanelOpen) {
      container.addEventListener("wheel", handleWheel, { passive: false });
      return () => container.removeEventListener("wheel", handleWheel);
    }
  }, [isPanelOpen, handleWheel]);

  const addHighlight = (highlight: NewHighlight): IHighlight => {
    console.log("Saving highlight", highlight);
    const newHighlight = { ...highlight, id: getNextId() };
    setHighlights((prev) => [newHighlight, ...prev]);
    return newHighlight;
  };

  const updateHighlight = (
    highlightId: string,
    position: Partial<ScaledPosition>,
    content: Partial<Content>,
  ) => {
    console.log("Updating highlight", highlightId, position, content);
    setHighlights((prevHighlights) =>
      prevHighlights.map((h) => {
        const {
          id,
          position: originalPosition,
          content: originalContent,
          ...rest
        } = h;
        return id === highlightId
          ? {
              id,
              position: { ...originalPosition, ...position },
              content: { ...originalContent, ...content },
              ...rest,
            }
          : h;
      }),
    );
  };

  const deleteHighlight = (id: string) => {
    setHighlights((prev) => prev.filter((h) => h.id !== id));
  };

  const saveComment = (highlightId: string, comment: string) => {
    setHighlights((prev) =>
      prev.map((h) =>
        h.id === highlightId ? { ...h, comment: comment.trim() || undefined } : h
      )
    );
    setEditingHighlight(null);
  };

  const resetHighlights = () => {
    setHighlights([]);
  };

  return (
    <div className="demo-container">
      {/* Main content area */}
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
                    onClick={() => {
                      setIsPanelOpen(true);
                      setTimeout(() => scrollViewerTo.current(highlight), 100);
                    }}
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
                onClick={() => {
                  console.log("=== Highlights Payload ===");
                  console.log(JSON.stringify(highlights, null, 2));
                  console.log("=== Raw Object ===");
                  console.log(highlights);
                }}
              >
                Log Payload
              </button>
              <button type="button" className="btn btn-danger" onClick={resetHighlights}>
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Slide-over panel */}
      {isPanelOpen && (
        <>
          <div
            className="panel-overlay"
            onClick={() => setIsPanelOpen(false)}
          />
          <div className="slide-panel">
            <div className="panel-header">
              <div className="panel-title">PDF Viewer</div>
              <div className="panel-controls">
                <button
                  type="button"
                  className="btn btn-small"
                  onClick={() => setPdfScaleValue("page-width")}
                  title="Fit to width"
                >
                  Fit Width
                </button>
                <span className="zoom-level">
                  {pdfScaleValue === "page-width" ? "Fit" : `${Math.round(parseFloat(pdfScaleValue) * 100)}%`}
                </span>
                <button
                  type="button"
                  className="btn btn-small"
                  onClick={() => setPdfScaleValue((prev) => {
                    const current = prev === "page-width" ? 1 : parseFloat(prev);
                    return Math.max(0.5, current - 0.25).toFixed(2);
                  })}
                >
                  −
                </button>
                <button
                  type="button"
                  className="btn btn-small"
                  onClick={() => setPdfScaleValue((prev) => {
                    const current = prev === "page-width" ? 1 : parseFloat(prev);
                    return Math.min(3, current + 0.25).toFixed(2);
                  })}
                >
                  +
                </button>
                <button
                  type="button"
                  className="btn btn-close"
                  onClick={() => setIsPanelOpen(false)}
                  title="Close"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="panel-content" ref={pdfContainerRef}>
              <PdfLoader url={PRIMARY_PDF_URL} beforeLoad={<Spinner />}>
                {(pdfDocument) => (
                  <PdfHighlighter
                    pdfDocument={pdfDocument}
                    pdfScaleValue={pdfScaleValue}
                    enableAreaSelection={(event) => event.altKey}
                    onScrollChange={() => {}}
                    scrollRef={(scrollTo) => {
                      scrollViewerTo.current = scrollTo;
                    }}
                    onSelectionFinished={(
                      position,
                      content,
                      hideTipAndSelection,
                      transformSelection,
                    ) => {
                      // Show action bar wrapper that manages its own state
                      return (
                        <SelectionActionBarWrapper
                          position={position}
                          content={content}
                          onHighlightCreated={(highlight) => {
                            // Don't call transformSelection() - it creates a ghost highlight
                            // that would overlap with the real highlight we're creating
                            return addHighlight(highlight);
                          }}
                          onOpenCommentDialog={setEditingHighlight}
                          onDelete={(id) => {
                            deleteHighlight(id);
                            hideTipAndSelection();
                          }}
                        />
                      );
                    }}
                    renderPopup={(highlight) => (
                      <HighlightActionBar
                        highlight={highlight}
                        onEdit={() => setEditingHighlight(highlight)}
                        onDelete={() => deleteHighlight(highlight.id)}
                      />
                    )}
                    onUpdate={(id, update) => {
                      updateHighlight(id, update.position ?? {}, update.content ?? {});
                    }}
                    highlights={highlights}
                  />
                )}
              </PdfLoader>
            </div>
            <div className="panel-footer">
              <span className="hint">💡 Ctrl+Scroll to zoom • Select text to highlight • Alt+drag for area selection</span>
            </div>

            {/* Comment dialog */}
            {editingHighlight && (
              <CommentDialog
                highlight={editingHighlight}
                onSave={(comment) => saveComment(editingHighlight.id, comment)}
                onCancel={() => setEditingHighlight(null)}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
