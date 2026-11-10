"use client";

import { useEffect, useRef, useState, type Ref } from "react";

import {
  DOCUMENT_CSS,
  DOCUMENT_FONTS_HREF,
} from "@/features/documents/lib/document-styles";
import type { SavedDocument } from "@/features/documents/types";

import { LetterDocument } from "./letter-document";
import { ProposalDocument } from "./proposal-document";

/** A4 width in CSS pixels (210mm at 96dpi). */
const SHEET_WIDTH = (210 * 96) / 25.4;

export function DocumentSheets({ doc }: { doc: SavedDocument }) {
  switch (doc.templateId) {
    case "proposal":
      return (
        <ProposalDocument data={(doc as SavedDocument<"proposal">).data} />
      );
    case "letter":
      return <LetterDocument data={(doc as SavedDocument<"letter">).data} />;
  }
}

/**
 * The document at real size, zoomed to fit the column. `sheetsRef` points at
 * the `.tbdoc` root, which is what gets exported and printed.
 */
export function DocumentPreview({
  doc,
  sheetsRef,
}: {
  doc: SavedDocument;
  sheetsRef: Ref<HTMLDivElement>;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const observer = new ResizeObserver(([entry]) => {
      setZoom(Math.min(1, entry.contentRect.width / SHEET_WIDTH));
    });
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={frameRef}
      className="w-full overflow-hidden rounded-xl border bg-muted p-3 sm:p-5"
    >
      <link rel="stylesheet" href={DOCUMENT_FONTS_HREF} precedence="default" />
      <style href="tbdoc-styles" precedence="default">
        {DOCUMENT_CSS}
      </style>
      <div
        className="mx-auto w-fit shadow-xl"
        style={{ zoom: Math.min(1, zoom * 0.98) }}
      >
        <div ref={sheetsRef} className="tbdoc">
          <DocumentSheets doc={doc} />
        </div>
      </div>
    </div>
  );
}
