/** Platform service charge (e.g. 5 = 5%). Used by cart, orders API, and receipts. */
export const DEFAULT_SERVICE_CHARGE_PERCENT = 5

export function getServiceChargePercent() {
  if (typeof process === 'undefined' || !process.env) return DEFAULT_SERVICE_CHARGE_PERCENT
  const raw = process.env.NEXT_PUBLIC_SERVICE_CHARGE_PERCENT || process.env.SERVICE_CHARGE_PERCENT
  const n = parseFloat(raw ?? String(DEFAULT_SERVICE_CHARGE_PERCENT))
  return Number.isFinite(n) && n >= 0 ? n : DEFAULT_SERVICE_CHARGE_PERCENT
}

export function computeServiceCharge(subtotal) {
  const s = Number(subtotal) || 0
  const pct = getServiceChargePercent()
  return Math.round(s * (pct / 100) * 100) / 100
}

export function computeOrderTotalWithService(subtotal) {
  return Math.round(((Number(subtotal) || 0) + computeServiceCharge(subtotal)) * 100) / 100
}
