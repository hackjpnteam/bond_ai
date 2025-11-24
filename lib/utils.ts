import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalize company name to logo path
 * Strips common prefixes like 株式会社, converts to lowercase
 */
export function getCompanyLogoPath(companyName: string): string {
  if (!companyName) return '/logos/bond.png';

  // Strip common prefixes
  let normalized = companyName
    .replace(/^株式会社/g, '')
    .replace(/^有限会社/g, '')
    .replace(/^合同会社/g, '')
    .replace(/株式会社$/g, '')
    .trim();

  // If empty after stripping, use original
  if (!normalized) {
    normalized = companyName;
  }

  return `/logos/${encodeURIComponent(normalized)}.png`;
}