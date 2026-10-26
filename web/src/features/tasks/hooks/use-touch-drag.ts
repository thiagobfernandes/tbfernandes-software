"use client";

import { useEffect, useRef } from "react";

const HOLD_MS = 350;
/** Moving further than this before the hold ends means the user is scrolling. */
const SLOP_PX = 8;

type TouchDragOptions = {
  /** Finds the drop target under the finger; undefined when there is none. */
  targetAt: (x: number, y: number) => string | undefined;
  onStart: (id: string) => void;
  onOver: (target: string | undefined) => void;
  /** Called on every move while dragging, e.g. to scroll near an edge. */
  onMove?: (x: number, y: number) => void;
  onDrop: (target: string | undefined) => void;
};

/**
 * HTML5 drag and drop does not fire on touch screens. This hook adds a
 * press-and-hold drag for touch: hold a card, move it, lift to drop. The
 * ghost element follows the finger through a ref, without re-rendering.
 */
export function useTouchDrag({
  targetAt,
  onStart,
  onOver,
  onMove,
  onDrop,
}: TouchDragOptions) {
  const ghostRef = useRef<HTMLDivElement>(null);
  const options = useRef({ targetAt, onStart, onOver, onMove, onDrop });
  const session = useRef<{
    id: string;
    timer?: number;
    startX: number;
    startY: number;
    offsetX: number;
    offsetY: number;
    active: boolean;
    target?: string;
  }>(undefined);

  useEffect(() => {
    options.current = { targetAt, onStart, onOver, onMove, onDrop };
  });

  useEffect(() => {
    function placeGhost(x: number, y: number) {
      const ghost = ghostRef.current;
      const current = session.current;
      if (!ghost || !current) return;
      ghost.style.transform = `translate(${x - current.offsetX}px, ${y - current.offsetY}px)`;
    }

    function move(event: TouchEvent) {
      const current = session.current;
      const touch = event.touches[0];
      if (!current || !touch) return;
      if (!current.active) {
        const moved = Math.hypot(
          touch.clientX - current.startX,
          touch.clientY - current.startY,
        );
        if (moved > SLOP_PX) cancel();
        return;
      }
      // Dragging: keep the page from scrolling under the finger.
      event.preventDefault();
      placeGhost(touch.clientX, touch.clientY);
      options.current.onMove?.(touch.clientX, touch.clientY);
      const target = options.current.targetAt(touch.clientX, touch.clientY);
      if (target !== current.target) {
        current.target = target;
        options.current.onOver(target);
      }
    }

    function end(event: TouchEvent) {
      const current = session.current;
      if (!current) return;
      window.clearTimeout(current.timer);
      session.current = undefined;
      if (current.active) {
        // Stops the tap that would follow from opening the card.
        event.preventDefault();
        options.current.onDrop(current.target);
      }
    }

    function cancel() {
      const current = session.current;
      if (!current) return;
      window.clearTimeout(current.timer);
      session.current = undefined;
      if (current.active) options.current.onDrop(undefined);
    }

    document.addEventListener("touchmove", move, { passive: false });
    document.addEventListener("touchend", end, { passive: false });
    document.addEventListener("touchcancel", cancel);
    return () => {
      document.removeEventListener("touchmove", move);
      document.removeEventListener("touchend", end);
      document.removeEventListener("touchcancel", cancel);
    };
  }, []);

  /** Spread on each draggable element. */
  function handlers(id: string) {
    return {
      onTouchStart(event: React.TouchEvent<HTMLElement>) {
        const touch = event.touches[0];
        if (!touch || event.touches.length > 1) return;
        const rect = event.currentTarget.getBoundingClientRect();
        const current = {
          id,
          startX: touch.clientX,
          startY: touch.clientY,
          offsetX: touch.clientX - rect.left,
          offsetY: touch.clientY - rect.top,
          active: false,
          timer: undefined as number | undefined,
        };
        current.timer = window.setTimeout(() => {
          current.active = true;
          navigator.vibrate?.(15);
          options.current.onStart(id);
          // The ghost renders on the next frame, once the board knows the id.
          requestAnimationFrame(() => {
            const ghost = ghostRef.current;
            if (ghost) {
              ghost.style.width = `${rect.width}px`;
              ghost.style.transform = `translate(${rect.left}px, ${rect.top}px)`;
            }
          });
        }, HOLD_MS);
        session.current = current;
      },
      onContextMenu(event: React.MouseEvent) {
        // A long press would otherwise open the browser's context menu.
        if (session.current) event.preventDefault();
      },
    };
  }

  /** True while a touch drag runs, so the native drag can step aside. */
  const isTouchDragging = () => Boolean(session.current?.active);

  return { ghostRef, handlers, isTouchDragging };
}
