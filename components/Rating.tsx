"use client";

import { useState } from "react";
import { Star } from "lucide-react";

interface RatingProps {
  value: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  totalRatings?: number;
}

export function Rating({
  value,
  onChange,
  readonly = false,
  size = "md",
  showValue = false,
  totalRatings,
}: RatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const handleClick = (rating: number) => {
    if (!readonly && onChange) {
      onChange(rating);
    }
  };

  const handleMouseEnter = (rating: number) => {
    if (!readonly) {
      setHoverValue(rating);
    }
  };

  const handleMouseLeave = () => {
    setHoverValue(null);
  };

  const displayValue = hoverValue !== null ? hoverValue : value;

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => handleClick(rating)}
            onMouseEnter={() => handleMouseEnter(rating)}
            onMouseLeave={handleMouseLeave}
            disabled={readonly}
            className={`${
              readonly ? "cursor-default" : "cursor-pointer hover:scale-110"
            } transition-transform`}
          >
            <Star
              className={`${sizeClasses[size]} transition-colors ${
                rating <= displayValue
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-transparent text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>
      {showValue && (
        <span className="text-ash-muted text-sm font-medium">
          {value.toFixed(1)}
          {totalRatings !== undefined && (
            <span className="ml-1 text-xs">({totalRatings})</span>
          )}
        </span>
      )}
    </div>
  );
}