
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const progressCircleVariants = cva(
  "inline-flex items-center justify-center rounded-full",
  {
    variants: {
      size: {
        sm: "h-12 w-12",
        md: "h-16 w-16",
        lg: "h-24 w-24",
        xl: "h-32 w-32",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

export interface ProgressCircleProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof progressCircleVariants> {
  value: number;
  strokeWidth?: number;
  showLabel?: boolean;
  labelClassName?: string;
}

export const ProgressCircle = React.forwardRef<
  HTMLDivElement,
  ProgressCircleProps
>(
  (
    {
      className,
      size,
      value,
      strokeWidth = 4,
      showLabel = true,
      labelClassName,
      ...props
    },
    ref
  ) => {
    // Ensure value is between 0 and 100
    const normalizedValue = Math.max(0, Math.min(100, value));
    
    // Calculate circle properties
    const radius = 50 - strokeWidth / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (normalizedValue / 100) * circumference;

    return (
      <div
        className={cn(progressCircleVariants({ size }), className)}
        ref={ref}
        {...props}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Background circle */}
          <circle
            className="text-muted-foreground/20"
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            stroke="currentColor"
          />
          {/* Progress circle */}
          <circle
            className="text-primary transition-all duration-300 ease-in-out"
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            stroke="currentColor"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 50 50)"
          />
          {/* Label */}
          {showLabel && (
            <text
              x="50"
              y="50"
              textAnchor="middle"
              dominantBaseline="middle"
              className={cn("text-foreground fill-current font-medium text-lg", labelClassName)}
            >
              {normalizedValue}%
            </text>
          )}
        </svg>
      </div>
    );
  }
);

ProgressCircle.displayName = "ProgressCircle";
