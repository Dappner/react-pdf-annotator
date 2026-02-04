import { useState, useCallback, useEffect, type RefObject } from "react";

const MIN_SCALE = 0.5;
const MAX_SCALE = 3;
const BUTTON_STEP = 0.1;
const WHEEL_SENSITIVITY = 0.0008;

export function useZoom(containerRef: RefObject<HTMLElement>, isActive: boolean) {
  const [pdfScaleValue, setPdfScaleValue] = useState<string>("page-width");

  const clampScale = useCallback((value: number) => {
    return Math.max(MIN_SCALE, Math.min(MAX_SCALE, value));
  }, []);

  const parseScaleValue = useCallback((value: string) => {
    return value === "page-width" ? 1 : parseFloat(value);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isActive) {
      return;
    }

    const normalizeDelta = (event: WheelEvent) => {
      let deltaY = event.deltaY;
      if (event.deltaMode === 1) {
        deltaY *= 16;
      } else if (event.deltaMode === 2) {
        deltaY *= 800;
      }
      return deltaY;
    };

    const handleWheel = (event: WheelEvent) => {
      if (!(event.ctrlKey || event.metaKey)) {
        return;
      }
      const target = event.target;
      if (!(target instanceof Node) || !container.contains(target)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const deltaY = normalizeDelta(event);
      const zoomFactor = Math.exp(-deltaY * WHEEL_SENSITIVITY);

      setPdfScaleValue((prev) => {
        const currentScale = parseScaleValue(prev);
        const nextScale = clampScale(currentScale * zoomFactor);
        return nextScale.toFixed(2);
      });
    };

    const doc = container.ownerDocument;
    doc.addEventListener("wheel", handleWheel, { passive: false, capture: true });
    return () => {
      doc.removeEventListener("wheel", handleWheel, { capture: true });
    };
  }, [containerRef, isActive, clampScale, parseScaleValue]);

  const zoomIn = () => {
    setPdfScaleValue((prev) => {
      const current = parseScaleValue(prev);
      return clampScale(current + BUTTON_STEP).toFixed(2);
    });
  };

  const zoomOut = () => {
    setPdfScaleValue((prev) => {
      const current = parseScaleValue(prev);
      return clampScale(current - BUTTON_STEP).toFixed(2);
    });
  };

  const fitWidth = () => {
    setPdfScaleValue("page-width");
  };

  const zoomLabel =
    pdfScaleValue === "page-width"
      ? "Fit"
      : `${Math.round(parseFloat(pdfScaleValue) * 100)}%`;

  return {
    pdfScaleValue,
    zoomLabel,
    zoomIn,
    zoomOut,
    fitWidth,
  };
}
