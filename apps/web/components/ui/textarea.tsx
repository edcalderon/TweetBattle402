import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "min-h-28 w-full resize-y border-2 border-ink bg-white p-3 text-sm font-semibold text-ink outline-none transition-shadow placeholder:text-black/35 focus:shadow-[4px_4px_0_#8f7cff]",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
