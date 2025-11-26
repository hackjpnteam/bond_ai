import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalize company name to logo path
 * Returns API endpoint for logo (stored in MongoDB)
 */
export function getCompanyLogoPath(companyName: string): string {
  if (!companyName) return '/bond-logo.png';

  // Strip common prefixes for slug
  let normalized = companyName
    .replace(/^株式会社/g, '')
    .replace(/^有限会社/g, '')
    .replace(/^合同会社/g, '')
    .replace(/株式会社$/g, '')
    .trim()
    .toLowerCase();

  // If empty after stripping, use original
  if (!normalized) {
    normalized = companyName.toLowerCase();
  }

  return `/api/company-logo/${encodeURIComponent(normalized)}`;
}