import React, { useCallback, useEffect, useRef, useState } from "react";
import styles from "../style/TipContainer.module.css";
import type { LTWHP } from "../types";

interface Props {
  children: JSX.Element | null;
  style: {
    top: number;
    left: number;
    bottom: number;
    highlightWidth?: number;
  };
  scrollTop: number;
  pageBoundingRect: LTWHP;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function TipContainer({
  children,
  style,
  scrollTop,
  pageBoundingRect,
  onMouseEnter,
  onMouseLeave,
}: Props) {
  const [height, setHeight] = useState(0);
  const [width, setWidth] = useState(0);
  const nodeRef = useRef<HTMLDivElement | null>(null);

  const updatePosition = useCallback(() => {
    if (!nodeRef.current) {
      return;
    }
    const { offsetHeight, offsetWidth } = nodeRef.current;
    setHeight(offsetHeight);
    setWidth(offsetWidth);
  }, []);

  useEffect(() => {
    setTimeout(updatePosition, 0);
  }, [updatePosition]);

  const isStyleCalculationInProgress = width === 0 && height === 0;

  const shouldMove = style.top - height - 5 < scrollTop;

  const top = shouldMove ? style.bottom + 5 : style.top - height - 5;

  // Center the popup on the highlight, then clamp to page bounds
  const highlightCenter = style.left + (style.highlightWidth ?? 0) / 2;
  const idealLeft = highlightCenter - width / 2;
  const pageRight = pageBoundingRect.left + pageBoundingRect.width;
  const left = clamp(
    idealLeft,
    pageBoundingRect.left,
    Math.max(pageBoundingRect.left, pageRight - width),
  );

  const handleUpdate = useCallback(() => {
    setWidth(0);
    setHeight(0);
    setTimeout(updatePosition, 0);
  }, [updatePosition]);

  const childrenWithProps = React.Children.map(children, (child) =>
    child != null
      ? React.cloneElement(child, {
          onUpdate: handleUpdate,
          popup: {
            position: shouldMove ? "below" : "above",
          },
        })
      : null,
  );

  return (
    <div
      id="PdfHighlighter__tip-container"
      className={styles.tipContainer}
      style={{
        visibility: isStyleCalculationInProgress ? "hidden" : "visible",
        top,
        left,
      }}
      ref={nodeRef}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {childrenWithProps}
    </div>
  );
}
