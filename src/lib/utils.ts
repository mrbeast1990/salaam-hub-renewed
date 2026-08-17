import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * تنسيق المبالغ المالية بالأرقام الإنجليزية (Western Digits)
 * مع دعم RTL و 2 خانة عشرية
 */
export function formatCurrency(amount: number | string | undefined | null) {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (value === undefined || value === null || isNaN(value)) return "0.00";
  
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * تنسيق الأعداد العادية بالأرقام الإنجليزية
 */
export function formatNumber(value: number | string | undefined | null) {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (num === undefined || num === null || isNaN(num)) return "0";
  
  return new Intl.NumberFormat('en-US').format(num);
}
