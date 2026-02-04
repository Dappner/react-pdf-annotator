import { useState } from "react";
import type { IHighlight, NewHighlight, ScaledPosition } from "../react-pdf-highlighter";
import { CommentIcon, EditIcon, DeleteIcon, CheckIcon } from "./Icons";

interface HighlightActionBarProps {
  highlight: IHighlight;
  onEdit: () => void;
  onDelete: () => void;
}

export function HighlightActionBar({ highlight, onEdit, onDelete }: HighlightActionBarProps) {
  return (
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
          className="action-btn action-btn--danger"
          onClick={onDelete}
          title="Delete highlight"
        >
          <DeleteIcon />
        </button>
      </div>
    </div>
  );
}

interface SelectionActionBarProps {
  position: ScaledPosition;
  content: { text?: string; image?: string };
  onHighlightCreated: (highlight: NewHighlight) => IHighlight;
  onOpenCommentDialog: (highlight: IHighlight) => void;
  onDelete: (id: string) => void;
}

export function SelectionActionBar({
  position,
  content,
  onHighlightCreated,
  onOpenCommentDialog,
  onDelete,
}: SelectionActionBarProps) {
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
