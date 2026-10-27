import Link from "next/link";
import { SearchX } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

/**
 * Shown when a detail route has no matching record. Records can be created in
 * the browser, so detail pages render this instead of calling notFound().
 */
export function MissingRecord({
  noun,
  backHref,
  backLabel,
}: {
  noun: string;
  backHref: string;
  backLabel: string;
}) {
  return (
    <PageContainer>
      <EmptyState
        icon={SearchX}
        title={`Não encontramos ${noun}`}
        description="O registro pode ter sido removido ou o link está errado."
        action={
          <Button variant="outline" asChild>
            <Link href={backHref}>{backLabel}</Link>
          </Button>
        }
      />
    </PageContainer>
  );
}
