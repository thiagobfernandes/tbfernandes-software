import type { PurchaseGoal } from "@/features/finance/types/finance";
import { addMonths } from "@/lib/money";
import { currentDay } from "@/lib/today";

/**
 * When the purchase becomes affordable at the planned monthly saving, and
 * whether that meets the desired date.
 */
export function projectPurchase(purchase: PurchaseGoal) {
  const missing = Math.max(0, purchase.estimated - purchase.reserved);
  if (missing === 0) return { missing, ready: true as const };
  if (!purchase.monthlySaving) return { missing, ready: false as const };
  const months = Math.ceil(missing / purchase.monthlySaving);
  const month = addMonths(currentDay().slice(0, 7), months);
  const desired = purchase.desiredDate?.slice(0, 7);
  return {
    missing,
    ready: false as const,
    months,
    month,
    onTime: desired ? month <= desired : undefined,
  };
}
