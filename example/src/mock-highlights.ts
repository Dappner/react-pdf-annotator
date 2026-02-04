import type { IHighlight } from "./react-pdf-highlighter";

/**
 * Preset highlights for testing different loading scenarios.
 * These use normalized coordinates (0-1 range) for portability.
 */
export const PRESET_HIGHLIGHTS: IHighlight[] = [
  {
    id: "preset-1",
    content: { text: "Preset highlight on page 1." },
    comment: "Loaded from mock data",
    position: {
      pageNumber: 1,
      usePdfCoordinates: false,
      boundingRect: {
        x1: 0.12,
        y1: 0.18,
        x2: 0.6,
        y2: 0.23,
        width: 1,
        height: 1,
        pageNumber: 1,
      },
      rects: [
        {
          x1: 0.12,
          y1: 0.18,
          x2: 0.6,
          y2: 0.23,
          width: 1,
          height: 1,
          pageNumber: 1,
        },
      ],
    },
  },
  {
    id: "preset-2",
    content: { text: "Preset highlight on page 2." },
    position: {
      pageNumber: 2,
      usePdfCoordinates: false,
      boundingRect: {
        x1: 0.15,
        y1: 0.35,
        x2: 0.7,
        y2: 0.4,
        width: 1,
        height: 1,
        pageNumber: 2,
      },
      rects: [
        {
          x1: 0.15,
          y1: 0.35,
          x2: 0.7,
          y2: 0.4,
          width: 1,
          height: 1,
          pageNumber: 2,
        },
      ],
    },
  },
  {
    id: "preset-3",
    content: { text: "Preset highlight on page 3." },
    position: {
      pageNumber: 3,
      usePdfCoordinates: false,
      boundingRect: {
        x1: 0.18,
        y1: 0.62,
        x2: 0.55,
        y2: 0.67,
        width: 1,
        height: 1,
        pageNumber: 3,
      },
      rects: [
        {
          x1: 0.18,
          y1: 0.62,
          x2: 0.55,
          y2: 0.67,
          width: 1,
          height: 1,
          pageNumber: 3,
        },
      ],
    },
  },
];
