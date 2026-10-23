import { Suspense } from "react";
import type { Metadata } from "next";

import { PageSkeleton } from "@/components/shared/page-skeleton";
import { ContactsPage } from "@/features/contacts/components/contacts-page";

export const metadata: Metadata = { title: "Contacts" };

export default function Page() {
  return (
    // Reads the URL query, which is only known at request time.
    <Suspense fallback={<PageSkeleton />}>
      <ContactsPage />
    </Suspense>
  );
}
