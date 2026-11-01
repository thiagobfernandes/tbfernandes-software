import Link from "next/link";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";

const components: Components = {
  h1: (props) => <h2 className="mt-6 text-xl font-semibold" {...props} />,
  h2: (props) => <h3 className="mt-6 text-lg font-semibold" {...props} />,
  h3: (props) => <h4 className="mt-5 text-base font-semibold" {...props} />,
  p: (props) => <p className="mt-3 leading-relaxed" {...props} />,
  // In-app paths (e.g. resolved [[wiki links]]) stay in the app; the rest
  // open in a new tab.
  a: ({ href, node, ...props }) => {
    void node;
    return href?.startsWith("/") ? (
      <Link
        href={href}
        className="font-medium text-primary underline decoration-dotted underline-offset-4"
        {...props}
      />
    ) : (
      <a
        href={href}
        className="font-medium text-primary underline underline-offset-4"
        target="_blank"
        rel="noreferrer"
        {...props}
      />
    );
  },
  ul: ({ className, ...props }) => (
    <ul
      className={cn(
        "mt-3 flex list-disc flex-col gap-1 pl-5",
        className?.includes("contains-task-list") && "list-none pl-0",
      )}
      {...props}
    />
  ),
  ol: (props) => (
    <ol className="mt-3 flex list-decimal flex-col gap-1 pl-5" {...props} />
  ),
  li: ({ className, ...props }) => (
    <li
      className={cn(
        className?.includes("task-list-item") &&
          "flex items-center gap-2 [&>input]:accent-primary",
      )}
      {...props}
    />
  ),
  blockquote: (props) => (
    <blockquote
      className="mt-3 border-l-2 border-primary/60 pl-4 text-muted-foreground italic"
      {...props}
    />
  ),
  code: ({ className, ...props }) =>
    className ? (
      <code className={cn("font-mono text-xs", className)} {...props} />
    ) : (
      <code
        className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]"
        {...props}
      />
    ),
  pre: (props) => (
    <pre
      className="mt-3 overflow-x-auto rounded-xl border bg-muted/50 p-4"
      {...props}
    />
  ),
  table: (props) => (
    <div className="mt-3 overflow-x-auto rounded-xl border">
      <table className="w-full text-sm" {...props} />
    </div>
  ),
  th: (props) => (
    <th
      className="border-b bg-muted/50 px-3 py-2 text-left font-medium"
      {...props}
    />
  ),
  td: (props) => <td className="border-b px-3 py-2" {...props} />,
  hr: () => <hr className="my-6 border-border" />,
};

/** Renders user Markdown (GFM). Raw HTML is not rendered. */
export function Markdown({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <div className={cn("text-sm [&>*:first-child]:mt-0", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
