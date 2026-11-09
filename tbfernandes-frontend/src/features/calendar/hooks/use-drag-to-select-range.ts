"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { LAST_MINUTE, MINUTES_PER_DAY } from "@/features/calendar/lib/time";

export type TimeRange = {
  day: string;
  startMinutes: number;
  endMinutes: number;
};

type Options = {
  scrollRef: React.RefObject<HTMLElement | null>;
  hourHeight: number;
  snapMinutes?: number;
  clickCreatesMinutes?: number | null;
  onSelect: (range: TimeRange) => void;
};

type Drag = {
  pointerId: number;
  day: string;
  column: HTMLElement;
  anchorSlot: number;
  originY: number;
  lastClientY: number;
  moved: boolean;
  active: boolean;
  longPressTimer?: number;
};

const DRAG_THRESHOLD_PX = 4;
const TOUCH_LONG_PRESS_MS = 350;
const TOUCH_SLOP_PX = 8;
const AUTO_SCROLL_EDGE_PX = 48;
const AUTO_SCROLL_MAX_STEP = 18;

export function useDragToSelectRange({
  scrollRef,
  hourHeight,
  snapMinutes = 15,
  clickCreatesMinutes = null,
  onSelect,
}: Options) {
  const [selection, setSelection] = useState<TimeRange | null>(null);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<Drag | null>(null);
  const frame = useRef<number | null>(null);
  const onSelectRef = useRef(onSelect);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  const boundaryAt = useCallback(
    (column: HTMLElement, clientY: number) => {
      const offset = clientY - column.getBoundingClientRect().top;
      const minutes = Math.min(
        Math.max((offset / hourHeight) * 60, 0),
        MINUTES_PER_DAY,
      );
      return Math.round(minutes / snapMinutes) * snapMinutes;
    },
    [hourHeight, snapMinutes],
  );

  const rangeFor = useCallback(
    (current: Drag): TimeRange => {
      const boundary = boundaryAt(current.column, current.lastClientY);
      let start = Math.min(current.anchorSlot, boundary);
      let end = Math.max(current.anchorSlot, boundary);
      if (end === start) {
        end = Math.min(start + snapMinutes, MINUTES_PER_DAY);
        start = end - snapMinutes;
      }
      return {
        day: current.day,
        startMinutes: start,
        endMinutes: Math.min(end, LAST_MINUTE),
      };
    },
    [boundaryAt, snapMinutes],
  );

  const stopAutoScroll = useCallback(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
  }, []);

  const startAutoScroll = useCallback(() => {
    if (frame.current !== null) return;
    const tick = () => {
      const current = drag.current;
      const container = scrollRef.current;
      if (!current?.active || !container) {
        frame.current = null;
        return;
      }
      const bounds = container.getBoundingClientRect();
      const fromTop = current.lastClientY - bounds.top;
      const fromBottom = bounds.bottom - current.lastClientY;
      let step = 0;
      if (fromTop < AUTO_SCROLL_EDGE_PX)
        step =
          -AUTO_SCROLL_MAX_STEP *
          (1 - Math.max(fromTop, 0) / AUTO_SCROLL_EDGE_PX);
      else if (fromBottom < AUTO_SCROLL_EDGE_PX)
        step =
          AUTO_SCROLL_MAX_STEP *
          (1 - Math.max(fromBottom, 0) / AUTO_SCROLL_EDGE_PX);
      if (step !== 0) {
        container.scrollTop += step;
        setSelection(rangeFor(current));
      }
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  }, [rangeFor, scrollRef]);

  const finish = useCallback(
    (commit: boolean) => {
      const current = drag.current;
      if (!current) return;
      window.clearTimeout(current.longPressTimer);
      stopAutoScroll();
      if (current.column.hasPointerCapture(current.pointerId))
        current.column.releasePointerCapture(current.pointerId);
      document.body.style.removeProperty("user-select");
      drag.current = null;
      setDragging(false);

      if (!commit || !current.active) {
        setSelection(null);
        return;
      }
      let range = rangeFor(current);
      if (!current.moved) {
        if (clickCreatesMinutes == null) {
          setSelection(null);
          return;
        }
        range = {
          ...range,
          startMinutes: current.anchorSlot,
          endMinutes: Math.min(
            current.anchorSlot + clickCreatesMinutes,
            LAST_MINUTE,
          ),
        };
      }
      setSelection(range);
      onSelectRef.current(range);
    },
    [clickCreatesMinutes, rangeFor, stopAutoScroll],
  );

  const activate = useCallback(() => {
    const current = drag.current;
    if (!current) return;
    current.active = true;
    document.body.style.setProperty("user-select", "none");
    setDragging(true);
    setSelection(rangeFor(current));
    startAutoScroll();
  }, [rangeFor, startAutoScroll]);

  useEffect(() => {
    if (!dragging) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        finish(false);
      }
    };
    const blockTouchScroll = (event: TouchEvent) => {
      if (drag.current?.active) event.preventDefault();
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("touchmove", blockTouchScroll, { passive: false });
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("touchmove", blockTouchScroll);
    };
  }, [dragging, finish]);

  useEffect(
    () => () => {
      stopAutoScroll();
      document.body.style.removeProperty("user-select");
    },
    [stopAutoScroll],
  );

  const columnHandlers = useCallback(
    (day: string) => ({
      onPointerDown(event: React.PointerEvent<HTMLElement>) {
        if (drag.current) return;
        if (event.pointerType === "mouse" && event.button !== 0) return;
        if ((event.target as HTMLElement).closest("[data-appointment]")) return;
        const column = event.currentTarget;
        const isTouch = event.pointerType !== "mouse";
        if (!isTouch) event.preventDefault();
        column.setPointerCapture(event.pointerId);
        drag.current = {
          pointerId: event.pointerId,
          day,
          column,
          anchorSlot: boundaryAt(column, event.clientY),
          originY: event.clientY,
          lastClientY: event.clientY,
          moved: false,
          active: false,
        };
        setSelection(null);
        if (isTouch) {
          drag.current.longPressTimer = window.setTimeout(
            activate,
            TOUCH_LONG_PRESS_MS,
          );
        } else {
          activate();
        }
      },
      onPointerMove(event: React.PointerEvent<HTMLElement>) {
        const current = drag.current;
        if (!current || current.pointerId !== event.pointerId) return;
        current.lastClientY = event.clientY;
        const distance = Math.abs(event.clientY - current.originY);
        if (!current.active) {
          if (distance > TOUCH_SLOP_PX) finish(false);
          return;
        }
        if (distance > DRAG_THRESHOLD_PX) current.moved = true;
        setSelection(rangeFor(current));
      },
      onPointerUp(event: React.PointerEvent<HTMLElement>) {
        if (drag.current?.pointerId === event.pointerId) finish(true);
      },
      onPointerCancel(event: React.PointerEvent<HTMLElement>) {
        if (drag.current?.pointerId === event.pointerId) finish(false);
      },
    }),
    [activate, boundaryAt, finish, rangeFor],
  );

  const clearSelection = useCallback(() => setSelection(null), []);

  return { selection, dragging, columnHandlers, clearSelection };
}
