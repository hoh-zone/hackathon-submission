import BN from 'bn.js';
import stringUtil from './stringUtil';

/**
 * *** BN ******，************。
 * @param numerator **
 * @param denominator **
 * @param precision *********，*** 10 *
 * @returns **********
 */
export function divideBN(
  numerator: BN,
  denominator: BN,
  precision = 10
): string {
  if (stringUtil.isEmpty(denominator)) {
    throw new Error('error');
  }
  if (denominator.isZero()) {
    throw new Error('error');
  }

  // *********
  const { div: integerPart, mod: remainder } = numerator.divmod(denominator);

  // ******，************
  if (remainder.isZero()) {
    return integerPart.toString();
  }

  let fraction = '';
  let currentRemainder = remainder;
  const ten = new BN(10);

  // ******，******* 10，*****
  for (let i = 0; i < precision; i++) {
    currentRemainder = currentRemainder.mul(ten);
    const { div: digit, mod } = currentRemainder.divmod(denominator);
    fraction += digit.toString();
    currentRemainder = mod;
    // ********，*****
    if (currentRemainder.isZero()) {
      break;
    }
  }

  return `${integerPart.toString()}.${fraction}`;
}
