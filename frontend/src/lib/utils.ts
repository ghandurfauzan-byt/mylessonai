import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind CSS class names with conflict resolution
 * (Standard shadcn/ui pattern - Bab 3 Design System).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
