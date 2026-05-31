import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 min-h-11 min-w-11 px-4",
  {
    variants: {
      variant: {
        default: "bg-stone-800 text-white hover:bg-stone-700",
        rose: "bg-rose-med-dark text-white hover:opacity-90",
        water: "bg-water-dark text-white hover:opacity-90",
        emerald: "bg-emerald-nut-dark text-white hover:opacity-90",
        violet: "bg-violet-ai-dark text-white hover:opacity-90",
        outline:
          "border border-border bg-surface-elevated hover:bg-stone-50 text-foreground",
        ghost: "hover:bg-stone-100",
      },
      size: {
        default: "h-11 px-4 py-2",
        sm: "h-9 px-3 text-sm",
        lg: "h-12 px-6",
        icon: "h-11 w-11 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
);
Button.displayName = "Button";
