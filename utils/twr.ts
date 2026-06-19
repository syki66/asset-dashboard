const MAX_LOSS_FACTOR = 0;

export function calculateTwrFactor(
  currentValue: number,
  previousValue: number,
  cashFlow: number,
): number {
  if (previousValue <= 0) return 1;

  const factor = (currentValue - cashFlow) / previousValue;
  return Number.isFinite(factor) && factor >= MAX_LOSS_FACTOR ? factor : 1;
}

export function annualizeTwr(factor: number, years: number): number {
  if (years <= 0) return 0;

  return Number(((Math.pow(factor, 1 / years) - 1) * 100).toFixed(2));
}
