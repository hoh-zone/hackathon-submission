import Decimal from 'decimal.js';

export function toSignificantDigitsUtils(value: number): string;
export function toSignificantDigitsUtils(value: Decimal): string;
export function toSignificantDigitsUtils(value: any): string {
  const decimalValue = value instanceof Decimal ? value : new Decimal(value);
  if (decimalValue.gte(Decimal('0.01'))) {
    return decimalValue
      .toFixed(2)
      .replace(/(\.\d*?[1-9])0+$/, '$1')
      .replace(/\.0*$/, '');
  } else if (decimalValue.gte(Decimal('0.001'))) {
    return decimalValue.toFixed(3);
  } else if (decimalValue.gte(Decimal('0.0001'))) {
    return decimalValue.toFixed(4);
  } else if (decimalValue.gte(Decimal('0.00001'))) {
    return decimalValue.toFixed(5);
  } else if (decimalValue.gte(Decimal('0.000001'))) {
    return decimalValue.toFixed(6);
  } else if (decimalValue.gte(Decimal('0.0000001'))) {
    return decimalValue.toFixed(7);
  } else if (decimalValue.gte(Decimal('0.000000001'))) {
    return decimalValue.toFixed(8);
  } else if (decimalValue.gte(Decimal('0.0000000001'))) {
    return decimalValue.toFixed(9);
  } else if (decimalValue.gte(Decimal('0.00000000001'))) {
    return decimalValue.toFixed(10);
  } else if (decimalValue.gte(Decimal('0.000000000001'))) {
    return decimalValue.toFixed(11);
  } else if (decimalValue.gte(Decimal('0.0000000000001'))) {
    return decimalValue.toFixed(12);
  } else {
    return '0';
  }
}
