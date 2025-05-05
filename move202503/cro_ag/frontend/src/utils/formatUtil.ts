export function formatBalance(
  balance: bigint | undefined,
  decimals: number | undefined
): string | undefined {
  if (balance !== undefined && decimals !== undefined) {
    const factor = BigInt(Math.pow(10, decimals));
    const integerPart = balance / factor; // ****
    const fractionalPart = balance % factor; // ****
    const fractionalString = fractionalPart.toString().padStart(decimals, '0'); // **
    // return `${integerPart}.${fractionalString.slice(0, decimalPoint)}`
    const balanceFormat = `${integerPart}.${fractionalString.slice(
      0,
      decimals
    )}`
      .replace(/(\.\d*?[1-9])0+$/, '$1')
      .replace(/\.0*$/, '');
    return balanceFormat;
  } else {
    return undefined;
  }
}
export function convertToBigInt(decimals: number, value: string): bigint {
  if (value == 'undefined') {
    return 0n;
  }
  const parts = value.split('.');
  const integerPart = parts[0];
  const fractionPart = parts[1] || '';
  const decCount = fractionPart.length;

  const normalized = integerPart + fractionPart;
  const num = BigInt(normalized);

  if (decimals > decCount) {
    return num * BigInt(10) ** BigInt(decimals - decCount);
  } else if (decimals < decCount) {
    return num / BigInt(10) ** BigInt(decCount - decimals);
  } else {
    return num;
  }
}
