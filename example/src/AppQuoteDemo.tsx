import { useCallback, useRef, useState } from "react";
import {
  Highlight,
  PdfHighlighter,
  PdfLoader,
  type HighlightCreatePayload,
  type IHighlight,
  type ScaledPosition,
} from "./react-pdf-highlighter";
import { Spinner } from "./Spinner";

const PRIMARY_PDF_URL = "https://arxiv.org/pdf/1708.08021";

const getNextId = () => String(Math.random()).slice(2);

type PendingSelection = {
  position: ScaledPosition;
  content: { text?: string; image?: string };
};

function AddQuoteDialog({
  pending,
  comment,
  onChangeComment,
  onCancel,
  onSave,
}: {
  pending: PendingSelection;
  comment: string;
  onChangeComment: (value: string) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(0, 0, 0, 0.25)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 20,
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: 8,
          padding: 16,
          width: 420,
          boxShadow: "0 10px 24px rgba(0, 0, 0, 0.2)",
        }}
      >
        <h3 style={{ margin: "0 0 8px" }}>Add Quote</h3>
        <p style={{ margin: "0 0 10px", fontSize: 12, color: "#4b5563" }}>
          {pending.content.text || "No text selected."}
        </p>
        <textarea
          style={{
            width: "100%",
            minHeight: 80,
            padding: 8,
            borderRadius: 6,
            border: "1px solid #d1d5db",
            fontSize: 12,
          }}
          placeholder="Add a comment"
          value={comment}
          onChange={(event) => onChangeComment(event.target.value)}
        />
        <div
          style={{
            marginTop: 10,
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
          }}
        >
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" onClick={onSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export function AppQuoteDemo() {
  const [highlights, setHighlights] = useState<Array<IHighlight>>([]);
  const [pendingHighlightId, setPendingHighlightId] = useState<string | null>(
    null,
  );
  const [actionHighlightId, setActionHighlightId] = useState<string | null>(
    null,
  );
  const [comment, setComment] = useState("");
  const scrollViewerTo = useRef((highlight: IHighlight) => {});

  const onCreate = useCallback((payload: HighlightCreatePayload) => {
    const id = `temp-${getNextId()}`;
    setHighlights((prev) => [
      {
        id,
        position: payload.position,
        content: payload.content,
        comment: undefined,
      },
      ...prev,
    ]);
  }, []);

  const pendingHighlight = pendingHighlightId
    ? highlights.find((highlight) => highlight.id === pendingHighlightId)
    : null;

  return (
    <div
      style={{ display: "flex", height: "100vh" }}
      onPointerDown={() => setActionHighlightId(null)}
    >
      <div style={{ width: "100vw", position: "relative" }}>
        <PdfLoader url={PRIMARY_PDF_URL} beforeLoad={<Spinner />}>
          {(pdfDocument) => (
            <PdfHighlighter
              pdfDocument={pdfDocument}
              enableAreaSelection={() => false}
              onScrollChange={() => {}}
              scrollRef={(scrollTo) => {
                scrollViewerTo.current = scrollTo;
              }}
              onCreate={onCreate}
              highlightTransform={(
                highlight,
                _index,
                setTip,
                hideTip,
                _viewportToScaled,
                _screenshot,
                isScrolledTo,
              ) => {
                const commentPopup = highlight.comment ? (
                  <div
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: 6,
                      boxShadow: "0 8px 18px rgba(0, 0, 0, 0.12)",
                      padding: 8,
                      fontSize: 12,
                      maxWidth: 240,
                    }}
                  >
                    {highlight.comment}
                  </div>
                ) : null;

                const actionPopup = (
                  <div
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: 6,
                      boxShadow: "0 8px 18px rgba(0, 0, 0, 0.12)",
                      padding: 6,
                      fontSize: 12,
                      maxWidth: 240,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <button
                      type="button"
                      aria-label={highlight.comment ? "Edit quote" : "Add quote"}
                      title={highlight.comment ? "Edit quote" : "Add quote"}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        border: "1px solid #e5e7eb",
                        background: "#f9fafb",
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        setPendingHighlightId(highlight.id);
                        setComment(highlight.comment ?? "");
                        setActionHighlightId(null);
                        hideTip();
                      }}
                    >
                      {highlight.comment ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
                          <path d="m15 5 4 4" />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M14 14a2 2 0 0 0 2-2V8h-2" />
                          <path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z" />
                          <path d="M8 14a2 2 0 0 0 2-2V8H8" />
                        </svg>
                      )}
                    </button>
                    <button
                      type="button"
                      aria-label="Delete"
                      title="Delete"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        border: "1px solid #fee2e2",
                        background: "#fef2f2",
                        color: "#dc2626",
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        setHighlights((prev) =>
                          prev.filter((h) => h.id !== highlight.id),
                        );
                        setActionHighlightId(null);
                        hideTip();
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M10 11v6" />
                        <path d="M14 11v6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                        <path d="M3 6h18" />
                        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                );

                const component = (
                  <Highlight
                    isScrolledTo={isScrolledTo}
                    position={highlight.position}
                    comment={highlight.comment}
                    onMouseOver={() => {
                      if (!commentPopup || actionHighlightId) {
                        return;
                      }
                      setTip(highlight, () => commentPopup);
                    }}
                    onMouseOut={() => {
                      if (actionHighlightId) {
                        return;
                      }
                      hideTip();
                    }}
                    onContextMenu={(event) => {
                      event.preventDefault();
                      setActionHighlightId(highlight.id);
                      setTip(highlight, () => actionPopup);
                    }}
                  />
                );

                return <div key={highlight.id}>{component}</div>;
              }}
              highlights={highlights}
            />
          )}
        </PdfLoader>
        {pendingHighlight ? (
          <AddQuoteDialog
            pending={{
              position: pendingHighlight.position as ScaledPosition,
              content: pendingHighlight.content,
            }}
            comment={comment}
            onChangeComment={setComment}
            onCancel={() => setPendingHighlightId(null)}
            onSave={() => {
              const newId = `saved-${getNextId()}`;
              const trimmedComment = comment.trim();
              setHighlights((prev) =>
                prev.map((h) =>
                  h.id === pendingHighlight.id
                    ? {
                        ...h,
                        id: newId,
                        comment: trimmedComment || undefined,
                      }
                    : h,
                ),
              );
              setPendingHighlightId(null);
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
