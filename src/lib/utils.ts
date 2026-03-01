import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateTotalAmount(
  amount: number,
  membersCount: number,
  gstPercentage: number,
) {
  const baseAmount = amount * membersCount;
  const gstAmount = baseAmount * (gstPercentage / 100);
  return baseAmount + gstAmount;
}
