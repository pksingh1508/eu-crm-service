import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// A fixed locale, so numbers render the same on the server and in the browser
export function formatNumber(value: number) {
  return value.toLocaleString("en-US")
}
