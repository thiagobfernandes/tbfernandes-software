import {
  companyStatusLabels,
  type CompanyRelationship,
  type CompanyStatus,
} from "@/features/projects/types/project";
import { cn } from "@/lib/utils";

const relationshipLabels: Record<CompanyRelationship, string> = {
  contractor: "Contratante",
  client: "Cliente",
  partner: "Parceira",
  own: "Minha empresa",
};

const statusStyles: Record<CompanyStatus, string> = {
  active: "text-success",
  inactive: "text-warning",
  closed: "text-muted-foreground",
};

export function RelationshipBadge({
  relationship,
}: {
  relationship: CompanyRelationship;
}) {
  return (
    <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
      {relationshipLabels[relationship]}
    </span>
  );
}

export function CompanyStatusLabel({ status }: { status: CompanyStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium capitalize",
        statusStyles[status],
      )}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {companyStatusLabels[status]}
    </span>
  );
}
