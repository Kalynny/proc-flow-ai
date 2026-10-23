import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "outline" | "ghost" }>(
  ({ className, variant = "primary", type = "button", ...props }, ref) => (
    <button ref={ref} type={type} className={cn(
      "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      variant === "primary" && "bg-primary text-primary-foreground hover:bg-primary/90",
      variant === "outline" && "border border-border hover:bg-muted/40",
      variant === "ghost" && "text-muted-foreground hover:text-foreground",
      className,
    )} {...props} />
  ),
);
Button.displayName = "Button";