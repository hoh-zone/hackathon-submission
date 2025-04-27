export function formatBalance(
  balance: bigint | undefined,
  decimals: number | undefined
  // ,decimalPoint = 5
): string {
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
    return '';
  }
}

/**
 * ***********（******、**********）*** BigInt，
 * ** 10^(decimals) *********。
 * @param decimals ****，** 18 ****** = value * 10^18 (******* 18 *)
 * @param value *****，*** "12", "12.3" * "12.34"
 * @returns **** BigInt **
 */
export function convertToBigInt(decimals: number, value: string): bigint {
  // *********
  const parts = value.split('.');
  const integerPart = parts[0];
  const fractionPart = parts[1] || ''; // **************
  const decCount = fractionPart.length; // *******

  // **********
  const normalized = integerPart + fractionPart;
  const num = BigInt(normalized);

  // ***************，**** 10^(decimals - decCount)
  if (decimals > decCount) {
    return num * BigInt(10) ** BigInt(decimals - decCount);
  }
  // ***************，*****（**：******，**************）
  else if (decimals < decCount) {
    return num / BigInt(10) ** BigInt(decCount - decimals);
  } else {
    return num;
  }
}

// **：
// const value1 = "12";      // ***
// const value2 = "12.3";    // ****
// const value3 = "12.34";   // ****
// const decimals = 18;

// console.log(convertToBigInt(decimals, value1).toString()); // ** "12" * 10^18 *****
// console.log(convertToBigInt(decimals, value2).toString()); // ** "123" * 10^(18-1)
// console.log(convertToBigInt(decimals, value3).toString()); // ** "1234" * 10^(18-2)
