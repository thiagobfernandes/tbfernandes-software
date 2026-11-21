import { Children, isValidElement } from "react";
import Link from "next/link";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

import { slugCounter } from "@/lib/markdown-headings";
import { cn } from "@/lib/utils";

type Variant = "compact" | "editorial";

/** Text content of rendered children, for heading anchors. */
function textOf(children: React.ReactNode): string {
  return Children.toArray(children)
    .map((child) =>
      typeof child === "string" || typeof child === "number"
        ? String(child)
        : isValidElement<{ children?: React.ReactNode }>(child)
          ? textOf(child.props.children)
          : "",
    )
    .join("");
}

const headingStyles: Record<Variant, [string, string, string]> = {
  compact: [
    "mt-6 text-xl font-semibold",
    "mt-6 text-lg font-semibold",
    "mt-5 text-base font-semibold",
  ],
  editorial: [
    "mt-10 text-[1.6rem] leading-tight font-semibold tracking-tight",
    "mt-9 text-[1.3rem] leading-snug font-semibold tracking-tight",
    "mt-7 text-[1.08rem] leading-snug font-semibold",
  ],
};

function buildComponents(variant: Variant): Components {
  const nextId = slugCounter();
  const editorial = variant === "editorial";
  const [h1, h2, h3] = headingStyles[variant];
  const heading = (Tag: "h2" | "h3" | "h4", className: string) => {
    function MarkdownHeading({
      node,
      children,
      ...props
    }: React.ComponentProps<"h2"> & { node?: unknown }) {
      void node;
      const id = nextId(textOf(children));
      return (
        <Tag
          id={id}
          className={cn(
            "group/heading scroll-mt-20 text-foreground",
            className,
          )}
          {...props}
        >
          {children}
          {editorial && (
            <a
              href={`#${id}`}
              aria-label="Link para esta seção"
              className="ml-2 text-muted-foreground/60 no-underline opacity-0 transition-opacity group-hover/heading:opacity-100 hover:text-primary focus-visible:opacity-100"
            >
              #
            </a>
          )}
        </Tag>
      );
    }
    return MarkdownHeading;
  };

  return {
    h1: heading("h2", h1),
    h2: heading("h3", h2),
    h3: heading("h4", h3),
    h4: (props) => <h5 className="mt-6 font-semibold" {...props} />,
    p: (props) => (
      <p
        className={cn(
          "mt-3",
          editorial ? "mt-4 leading-[1.75]" : "leading-relaxed",
        )}
        {...props}
      />
    ),
    // In-app paths (e.g. resolved [[wiki links]]) stay in the app; the rest
    // open in a new tab.
    a: ({ href, node, ...props }) => {
      void node;
      return href?.startsWith("/") ? (
        <Link
          href={href}
          className="font-medium text-primary underline decoration-primary/40 decoration-dotted underline-offset-4 hover:decoration-primary"
          {...props}
        />
      ) : href?.startsWith("#") ? (
        <a
          href={href}
          className="text-primary underline underline-offset-4"
          {...props}
        />
      ) : (
        <a
          href={href}
          className="font-medium text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary"
          target="_blank"
          rel="noreferrer"
          {...props}
        />
      );
    },
    ul: ({ className, ...props }) => (
      <ul
        className={cn(
          "flex list-disc flex-col pl-5 marker:text-muted-foreground",
          editorial ? "mt-4 gap-1.5" : "mt-3 gap-1",
          className?.includes("contains-task-list") && "list-none pl-0",
        )}
        {...props}
      />
    ),
    ol: (props) => (
      <ol
        className={cn(
          "flex list-decimal flex-col pl-5 marker:text-muted-foreground",
          editorial ? "mt-4 gap-1.5" : "mt-3 gap-1",
        )}
        {...props}
      />
    ),
    li: ({ className, ...props }) => (
      <li
        className={cn(
          "pl-1",
          className?.includes("task-list-item") &&
            "flex items-start gap-2 pl-0 [&>input]:mt-[0.45em] [&>input]:accent-primary",
        )}
        {...props}
      />
    ),
    blockquote: (props) => (
      <blockquote
        className={cn(
          "border-l-2 border-primary/50 pl-4 text-muted-foreground",
          editorial ? "my-6 [&>p]:mt-2" : "mt-3 italic",
        )}
        {...props}
      />
    ),
    code: ({ className, ...props }) =>
      className ? (
        <code
          className={cn("font-mono text-[0.82rem]", className)}
          {...props}
        />
      ) : (
        <code
          className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]"
          {...props}
        />
      ),
    pre: (props) => (
      <pre
        className={cn(
          "overflow-x-auto rounded-lg border bg-muted/40 p-4 leading-relaxed",
          editorial ? "my-6" : "mt-3",
        )}
        {...props}
      />
    ),
    table: (props) => (
      <div
        className={cn(
          "overflow-x-auto",
          editorial ? "my-6" : "mt-3 rounded-xl border",
        )}
      >
        <table className="w-full border-collapse text-sm" {...props} />
      </div>
    ),
    th: (props) => (
      <th
        className="border-b px-3 py-2 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase"
        {...props}
      />
    ),
    td: (props) => (
      <td
        className="border-b border-border/60 px-3 py-2 align-top"
        {...props}
      />
    ),
    hr: () => (
      <hr className={cn("border-border", editorial ? "my-10" : "my-6")} />
    ),
    img: ({ node, alt, ...props }) => {
      void node;
      return (
        // eslint-disable-next-line @next/next/no-img-element -- user content from arbitrary hosts
        <img
          alt={alt ?? ""}
          loading="lazy"
          className="my-6 max-w-full rounded-lg border"
          {...props}
        />
      );
    },
  };
}

/** Renders user Markdown (GFM). Raw HTML is not rendered. */
export function Markdown({
  children,
  className,
  variant = "compact",
}: {
  children: string;
  className?: string;
  /** `editorial` is the long-form reading style of the notes page. */
  variant?: Variant;
}) {
  return (
    <div
      className={cn(
        "[&>*:first-child]:mt-0",
        variant === "editorial" ? "text-base text-foreground/90" : "text-sm",
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={buildComponents(variant)}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
