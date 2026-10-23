import Form from "next/form";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";

/** Searches tasks for now; becomes global search once the API exists. */
export function HeaderSearch() {
  return (
    <Form
      action="/tasks"
      role="search"
      className="relative hidden w-full max-w-sm sm:block"
    >
      <Search
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        type="search"
        name="q"
        placeholder="Search tasks…"
        aria-label="Search tasks"
        className="h-9 rounded-full bg-muted/50 pl-9 dark:bg-muted/50"
      />
    </Form>
  );
}
