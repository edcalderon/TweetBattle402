import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap border-2 border-ink px-4 py-2.5 text-xs font-black uppercase tracking-[0.13em] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acid disabled:pointer-events-none disabled:opacity-45",
  {
    variants: {
      variant: {
        default:
          "bg-acid text-ink shadow-hard hover:-translate-y-0.5 hover:shadow-[7px_7px_0_#11100e]",
        dark: "bg-ink text-paper shadow-[5px_5px_0_#8f7cff] hover:-translate-y-0.5",
        outline: "bg-paper text-ink hover:bg-white",
        ghost:
          "border-transparent bg-transparent text-current hover:border-current",
        danger: "bg-ember text-white shadow-hard",
      },
      size: {
        default: "h-11",
        sm: "h-9 px-3 text-[10px]",
        lg: "h-14 px-6 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
