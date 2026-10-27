const fiveHundredSlabTypes = new Set([
  'GCash Cash-in',
  'GCash Cash-out',
  'Maya Cash-in',
  'Maya Cash-out',
])

export function calculatePaymentCharge(type: string, amount: number) {
  if (!Number.isFinite(amount) || amount <= 0) return 0

  const slabSize = fiveHundredSlabTypes.has(type) ? 500 : 1000
  return Math.ceil(amount / slabSize) * 5
}