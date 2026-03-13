import * as React from "react";

import { cn } from "@/lib/utils/cn";

type AlertVariant = "default" | "destructive" | "success";

const alertClasses: Record<AlertVariant, string> = {
  default: "border-border bg-secondary/40 text-foreground",
  destructive: "border-red-500/30 bg-red-500/10 text-red-200",
  success: "border-primary/30 bg-primary/10 text-emerald-100"
};

export function Alert({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: AlertVariant }) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3 text-sm leading-6",
        alertClasses[variant],
        className
      )}
      role="alert"
      {...props}
    />
  );
}

export function AlertTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("font-semibold", className)} {...props} />;
}

export function AlertDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("mt-1 text-sm opacity-90", className)} {...props} />;
}
