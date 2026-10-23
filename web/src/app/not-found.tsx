import Link from "next/link";
import { SearchX } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <EmptyState
        icon={SearchX}
        title="Page not found"
        description="This page does not exist or has not been built yet."
        action={
          <Button asChild size="sm">
            <Link href="/">Back to dashboard</Link>
          </Button>
        }
        className="w-full max-w-md"
      />
    </main>
  );
}
