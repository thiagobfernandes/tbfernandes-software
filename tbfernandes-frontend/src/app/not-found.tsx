import Link from "next/link";
import { SearchX } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <EmptyState
        icon={SearchX}
        title="Página não encontrada"
        description="Esta página não existe ou ainda não foi construída."
        action={
          <Button asChild size="sm">
            <Link href="/">Voltar ao início</Link>
          </Button>
        }
        className="w-full max-w-md"
      />
    </main>
  );
}
