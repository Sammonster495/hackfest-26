"use client";

import { GripHorizontal, GripVertical, X } from "lucide-react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { PdfWindow } from "./types";

const MIN_WIDTH = 320;
const MIN_HEIGHT = 240;

export function FloatingPdfWindows({
  windows,
  onClose,
  onFocus,
  onMove,
  onResize,
}: {
  windows: PdfWindow[];
  onClose: (id: string) => void;
  onFocus: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onResize: (id: string, width: number, height: number) => void;
}) {
  const startDrag = (
    e: ReactPointerEvent<HTMLDivElement>,
    windowItem: PdfWindow,
  ) => {
    e.preventDefault();
    onFocus(windowItem.id);

    const startX = e.clientX;
    const startY = e.clientY;
    const startLeft = windowItem.x;
    const startTop = windowItem.y;

    const handleMove = (ev: PointerEvent) => {
      const nextX = Math.max(0, startLeft + (ev.clientX - startX));
      const nextY = Math.max(0, startTop + (ev.clientY - startY));
      onMove(windowItem.id, nextX, nextY);
    };

    const handleUp = () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  };

  const startResize = (
    e: ReactPointerEvent<HTMLDivElement>,
    windowItem: PdfWindow,
    direction: "right" | "bottom" | "corner" = "corner",
  ) => {
    e.preventDefault();
    e.stopPropagation();
    onFocus(windowItem.id);

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = windowItem.width;
    const startHeight = windowItem.height;
    const maxWidth = window.innerWidth - windowItem.x;
    const maxHeight = window.innerHeight - windowItem.y;

    const handleMove = (ev: PointerEvent) => {
      const proposedWidth = startWidth + (ev.clientX - startX);
      const proposedHeight = startHeight + (ev.clientY - startY);
      const width = Math.max(MIN_WIDTH, Math.min(maxWidth, proposedWidth));
      const height = Math.max(MIN_HEIGHT, Math.min(maxHeight, proposedHeight));

      if (direction === "right") {
        onResize(windowItem.id, width, startHeight);
        return;
      }

      if (direction === "bottom") {
        onResize(windowItem.id, startWidth, height);
        return;
      }

      onResize(windowItem.id, width, height);
    };

    const handleUp = () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {windows.map((windowItem) => (
        <div
          key={windowItem.id}
          className="absolute pointer-events-auto rounded-lg border bg-background shadow-2xl overflow-hidden"
          style={{
            left: windowItem.x,
            top: windowItem.y,
            width: windowItem.width,
            height: windowItem.height,
            zIndex: windowItem.zIndex,
            minWidth: MIN_WIDTH,
            minHeight: MIN_HEIGHT,
          }}
          onPointerDown={() => onFocus(windowItem.id)}
        >
          <div
            className="h-10 px-3 border-b bg-muted flex items-center justify-between cursor-move"
            onPointerDown={(e) => startDrag(e, windowItem)}
          >
            <p className="text-sm font-medium truncate pr-2">
              {windowItem.title}
            </p>
            <button
              type="button"
              className="h-7 w-7 rounded hover:bg-muted-foreground/10 inline-flex items-center justify-center"
              onClick={() => onClose(windowItem.id)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <iframe
            src={windowItem.url}
            title={windowItem.title}
            className="w-full h-[calc(100%-40px)]"
          />

          <div
            className="absolute right-0 top-10 bottom-0 w-2 cursor-e-resize hover:bg-primary/10"
            onPointerDown={(e) => startResize(e, windowItem, "right")}
          >
            <div className="absolute top-1/2 right-0 -translate-y-1/2 pr-0.5 text-muted-foreground/70">
              <GripVertical className="h-3 w-3" />
            </div>
          </div>

          <div
            className="absolute left-0 right-0 bottom-0 h-2 cursor-s-resize hover:bg-primary/10"
            onPointerDown={(e) => startResize(e, windowItem, "bottom")}
          >
            <div className="absolute left-1/2 bottom-0 -translate-x-1/2 pb-0.5 text-muted-foreground/70">
              <GripHorizontal className="h-3 w-3" />
            </div>
          </div>

          <div
            className="absolute right-0 bottom-0 h-5 w-5 cursor-se-resize bg-muted/60 border-l border-t"
            onPointerDown={(e) => startResize(e, windowItem, "corner")}
          />
        </div>
      ))}
    </div>
  );
}
