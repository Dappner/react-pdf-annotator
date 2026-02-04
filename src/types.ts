export interface LTWH {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface LTWHP extends LTWH {
  pageNumber?: number;
}

export interface Scaled {
  x1: number;
  y1: number;

  x2: number;
  y2: number;

  width: number;
  height: number;

  pageNumber?: number;
}

export interface Position {
  boundingRect: LTWHP;
  rects: Array<LTWHP>;
  pageNumber: number;
}

export interface ScaledPosition {
  boundingRect: Scaled;
  rects: Array<Scaled>;
  pageNumber: number;
  usePdfCoordinates?: boolean;
}

export interface Content {
  text?: string;
  image?: string;
}

export interface HighlightContent {
  content: Content;
}

export type Comment = string;

export interface HighlightComment {
  comment?: Comment;
}

export interface NewHighlight extends HighlightContent, HighlightComment {
  position: ScaledPosition;
}

export interface IHighlight extends HighlightBase {}

export interface ViewportHighlight extends HighlightContent, HighlightComment {
  position: Position;
}

export interface HighlightBase extends NewHighlight {
  id: string;
  meta?: Record<string, unknown>;
}

export interface HighlightPayload {
  id?: string;
  content: Content;
  position: ScaledPosition;
  comment?: Comment;
  color?: string;
  meta?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface HighlightCreatePayload {
  content: Content;
  position: ScaledPosition;
}

export interface HighlightHooks {
  onCreate?: (highlight: HighlightCreatePayload) => void;
  onUpdate?: (id: string, patch: Partial<HighlightPayload>) => void;
  onDelete?: (id: string) => void;
}

export interface Viewport {
  convertToPdfPoint: (x: number, y: number) => Array<number>;
  convertToViewportRectangle: (pdfRectangle: Array<number>) => Array<number>;
  width: number;
  height: number;
}

export interface Page {
  node: HTMLElement;
  number: number;
}
