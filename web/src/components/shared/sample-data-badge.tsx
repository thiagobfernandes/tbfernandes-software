import { Badge } from "@/components/ui/badge";
import { env } from "@/lib/env";

/** Marks UI that shows illustrative data until the API is connected. */
export function SampleDataBadge() {
  if (env.dataSource === "api") return null;
  return (
    <Badge variant="outline" className="border-dashed text-muted-foreground">
      Dados de exemplo
    </Badge>
  );
}
