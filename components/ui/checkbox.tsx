import * as React from "react";

import { cn } from "@/lib/utils/cn";

export interface CheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type="checkbox"
        className={cn(
          "h-4 w-4 rounded border-border bg-[#0d0d0d] text-primary focus:ring-2 focus:ring-primary/30",
          className
        )}
        {...props}
      />
    );
  }
);

Checkbox.displayName = "Checkbox";
