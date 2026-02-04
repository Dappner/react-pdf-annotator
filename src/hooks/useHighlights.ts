import { useCallback, useState } from "react";
import type { IHighlight } from "../types";

const defaultGetId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return String(Math.random()).slice(2);
};

type HighlightInput<T extends IHighlight> = Omit<T, "id"> & { id?: string };
type HighlightPatch<T extends IHighlight> = Partial<Omit<T, "id">>;

export interface UseHighlightsOptions<T extends IHighlight> {
  highlights: T[];
  setHighlights: (next: T[] | ((prev: T[]) => T[])) => void;
  getId?: () => string;
}

export function useHighlights<T extends IHighlight>({
  highlights,
  setHighlights,
  getId,
}: UseHighlightsOptions<T>) {
  const [editingHighlight, setEditingHighlight] = useState<T | null>(null);

  const resolveId = useCallback(() => getId?.() ?? defaultGetId(), [getId]);

  const addHighlight = useCallback(
    (highlight: HighlightInput<T>): T => {
      const newHighlight = { ...highlight, id: highlight.id ?? resolveId() } as T;
      setHighlights((prev) => [newHighlight, ...prev]);
      return newHighlight;
    },
    [resolveId, setHighlights],
  );

  const updateHighlight = useCallback(
    (highlightId: string, patch: HighlightPatch<T>) => {
      setHighlights((prevHighlights) =>
        prevHighlights.map((highlight) => {
          if (highlight.id !== highlightId) {
            return highlight;
          }

          const nextPosition = patch.position
            ? { ...highlight.position, ...patch.position }
            : highlight.position;
          const nextContent = patch.content
            ? { ...highlight.content, ...patch.content }
            : highlight.content;

          return {
            ...highlight,
            ...patch,
            id: highlight.id,
            position: nextPosition,
            content: nextContent,
          };
        }),
      );
    },
    [setHighlights],
  );

  const deleteHighlight = useCallback(
    (highlightId: string) => {
      setHighlights((prev) =>
        prev.filter((highlight) => highlight.id !== highlightId),
      );
    },
    [setHighlights],
  );

  const saveComment = useCallback(
    (highlightId: string, comment: string) => {
      updateHighlight(highlightId, {
        comment: comment.trim() || undefined,
      } as HighlightPatch<T>);
      setEditingHighlight(null);
    },
    [updateHighlight],
  );

  const resetHighlights = useCallback(() => {
    setHighlights([]);
  }, [setHighlights]);

  return {
    highlights,
    editingHighlight,
    setEditingHighlight,
    addHighlight,
    updateHighlight,
    deleteHighlight,
    saveComment,
    resetHighlights,
  };
}
