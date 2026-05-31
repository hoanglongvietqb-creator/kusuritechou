import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-xl border border-border bg-surface-elevated px-3 py-2 text-base placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-ai/40",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
