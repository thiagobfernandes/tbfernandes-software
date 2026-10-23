import { Badge } from "@/components/ui/badge";

/** Marks UI that shows illustrative data until the API is connected. */
export function SampleDataBadge() {
  return (
    <Badge variant="outline" className="border-dashed text-muted-foreground">
      Sample data
    </Badge>
  );
}
