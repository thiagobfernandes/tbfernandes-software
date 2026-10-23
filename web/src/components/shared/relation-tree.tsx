import Link from "next/link";

import { cn } from "@/lib/utils";

export type RelationNode = {
  id: string;
  label: string;
  /** Short type label shown above the node, e.g. "Goal" or "Project". */
  kind?: string;
  href?: string;
  children?: RelationNode[];
};

/**
 * Renders a hierarchy of related records (goal → project → task) as a tree
 * with connector lines. Purely presentational: callers pass real relations.
 */
export function RelationTree({
  root,
  className,
}: {
  root: RelationNode;
  className?: string;
}) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <div className="relation-tree mx-auto w-max min-w-full py-2">
        <ul>
          <TreeItem node={root} isRoot />
        </ul>
      </div>
    </div>
  );
}

function TreeItem({
  node,
  isRoot = false,
}: {
  node: RelationNode;
  isRoot?: boolean;
}) {
  const hasChildren = Boolean(node.children?.length);

  return (
    <li>
      <TreeNode node={node} isRoot={isRoot} hasChildren={hasChildren} />
      {hasChildren && (
        <ul>
          {node.children!.map((child) => (
            <TreeItem key={child.id} node={child} />
          ))}
        </ul>
      )}
    </li>
  );
}

function TreeNode({
  node,
  isRoot,
  hasChildren,
}: {
  node: RelationNode;
  isRoot: boolean;
  hasChildren: boolean;
}) {
  const className = cn(
    "relative flex flex-col items-center gap-0.5 rounded-lg border bg-card px-3.5 py-2 text-center text-sm whitespace-nowrap shadow-sm transition-colors",
    node.href &&
      "hover:border-primary/60 focus-visible:ring-[3px] focus-visible:ring-ring/50 outline-none",
    isRoot &&
      "border-primary/50 bg-primary/15 font-medium text-foreground shadow-[0_0_32px_-4px_color-mix(in_oklab,var(--primary)_55%,transparent)]",
  );

  const content = (
    <>
      {!isRoot && <Dot className="-top-[3px]" />}
      {node.kind && (
        <span className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
          {node.kind}
        </span>
      )}
      <span>{node.label}</span>
      {hasChildren && <Dot className="-bottom-[3px]" />}
    </>
  );

  if (node.href) {
    return (
      <Link href={node.href} className={className}>
        {content}
      </Link>
    );
  }
  return <div className={className}>{content}</div>;
}

function Dot({ className }: { className: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "absolute left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-foreground",
        className,
      )}
    />
  );
}
