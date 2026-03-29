/**
 * Compare utility for Oracle Resolution Engine
 * Core logic for evaluating oracle conditions
 */

export type CompareOperator = '>=' | '>' | '<=' | '<' | '==';

export function compareValue(
  actual: number,
  operator: CompareOperator,
  target: number
): boolean {
  switch (operator) {
    case '>=':
      return actual >= target;
    case '>':
      return actual > target;
    case '<=':
      return actual <= target;
    case '<':
      return actual < target;
    case '==':
      return Math.abs(actual - target) < 0.0001; // Floating point tolerance
    default:
      throw new Error(`Unsupported operator: ${operator}`);
  }
}

export function formatCondition(
  asset: string,
  operator: CompareOperator,
  targetValue: number,
  metric: string = 'price'
): string {
  const assetUpper = asset.toUpperCase();
  const metricLabel = metric === 'price' ? '' : ` ${metric}`;
  return `${assetUpper}${metricLabel} ${operator} $${targetValue.toLocaleString()}`;
}

export function formatOutcomeExplanation(
  isYes: boolean,
  asset: string,
  operator: CompareOperator,
  targetValue: number,
  actualValue: number
): string {
  const assetUpper = asset.toUpperCase();
  const result = isYes ? 'YES' : 'NO';
  return `${result}: ${assetUpper} is at $${actualValue.toLocaleString()} which is ${
    isYes ? '' : 'NOT '
  }${operator} $${targetValue.toLocaleString()}`;
}
