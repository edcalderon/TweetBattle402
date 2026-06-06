import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-12 w-full border-2 border-ink bg-white px-3 text-sm font-semibold text-ink outline-none transition-shadow placeholder:text-black/35 focus:shadow-[4px_4px_0_#8f7cff]",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";
