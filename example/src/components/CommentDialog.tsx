import { useState } from "react";
import type { IHighlight } from "../react-pdf-highlighter";

interface CommentDialogProps {
  highlight: IHighlight;
  onSave: (comment: string) => void;
  onCancel: () => void;
}

export function CommentDialog({ highlight, onSave, onCancel }: CommentDialogProps) {
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
