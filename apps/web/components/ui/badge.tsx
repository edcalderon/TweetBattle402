import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center border border-current px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em]",
        className,
      )}
      {...props}
    />
  );
}
