import styles from "../style/Highlight.module.css";
import type { LTWHP } from "../types.js";

interface Props {
  position: {
    boundingRect: LTWHP;
    rects: Array<LTWHP>;
  };
  onClick?: () => void;
  onMouseOver?: () => void;
  onMouseOut?: () => void;
  onContextMenu?: (event: React.MouseEvent) => void;
  comment?: string;
  isScrolledTo: boolean;
}

export function Highlight({
  position,
  onClick,
  onMouseOver,
  onMouseOut,
  onContextMenu,
  comment,
  isScrolledTo,
}: Props) {
  const { rects, boundingRect } = position;

  return (
    <div
      className={`Highlight ${styles.highlight} ${isScrolledTo ? styles.scrolledTo : ""}`}
    >
      {comment ? (
        <div
          className={`Highlight__comment-icon ${styles.commentIcon}`}
          style={{
            left: boundingRect.left + boundingRect.width + 6,
            top: boundingRect.top,
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
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
        </div>
      ) : null}
      <div className={`Highlight__parts ${styles.parts}`}>
        {rects.map((rect, index) => (
          <div
            onMouseOver={onMouseOver}
            onMouseOut={onMouseOut}
            onClick={onClick}
            onContextMenu={onContextMenu}
            // biome-ignore lint/suspicious/noArrayIndexKey: We can use position hash at some point in future
            key={index}
            style={rect}
            className={`Highlight__part ${styles.part}`}
          />
        ))}
      </div>
    </div>
  );
}
