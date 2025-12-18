"use client";

import * as React from "react";
import { Clear } from "./icons";

interface ClearButtonProps {
  onClear: () => void;
}

export const ClearButton = ({ onClear }: ClearButtonProps) => {
  const handleClear = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Use preventDefault to stop the input from losing focus before clear executes
    e.preventDefault();
    e.stopPropagation();
    onClear();
  };

  return (
    <button
      type="button"
      onMouseDown={handleClear}
      className="flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
      aria-label="Clear"
    >
      <Clear />
    </button>
  );
};
