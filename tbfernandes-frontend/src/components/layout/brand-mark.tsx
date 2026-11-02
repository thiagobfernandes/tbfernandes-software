import Image from "next/image";

import { cn } from "@/lib/utils";

import symbol from "../../../public/brand/logo-symbol.png";
import wordmark from "../../../public/brand/logo-tbfernandes.png";

/** The logo: full wordmark, or just the laptop symbol when the sidebar is collapsed. */
export function BrandMark({
  collapsed = false,
  className,
}: {
  collapsed?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex h-8 items-center", className)}>
      {collapsed ? (
        <Image
          src={symbol}
          alt="TBFernandes"
          priority
          className="h-6 w-auto shrink-0"
        />
      ) : (
        <Image
          src={wordmark}
          alt="TBFernandes"
          priority
          className="h-6 w-auto max-w-full"
        />
      )}
    </div>
  );
}
