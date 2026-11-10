"use client";

import { Suspense } from "react";

import { DetailSkeleton } from "@/components/shared/detail-skeleton";
import { useQueryId } from "@/components/shared/query-id";
import { DocumentEditorPage } from "@/features/documents/components/document-editor-page";

export default function Page() {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <Editor />
    </Suspense>
  );
}

function Editor() {
  return <DocumentEditorPage documentId={useQueryId()} />;
}
