/**
 * 格式化SUI代币金额
 * @param amount 代币金额，单位为MIST
 * @returns 格式化后的字符串，以SUI为单位
 */
export function formatSuiCoin(amount: string | number | bigint): string {
  if (!amount) return '0';
  
  // 转换为BigInt
  const amountBigInt = typeof amount === 'string' ? BigInt(amount) : 
                        typeof amount === 'number' ? BigInt(Math.floor(amount)) : amount;
  
  // SUI精度为9位
  const SUI_DECIMALS = 9;
  const SUI_DECIMALS_FACTOR = BigInt(10 ** SUI_DECIMALS);
  
  // 计算整数部分和小数部分
  const integerPart = amountBigInt / SUI_DECIMALS_FACTOR;
  const decimalPart = amountBigInt % SUI_DECIMALS_FACTOR;
  
  // 格式化小数部分，去除尾部的0
  let formattedDecimal = decimalPart.toString().padStart(SUI_DECIMALS, '0');
  formattedDecimal = formattedDecimal.replace(/0+$/, '');
  
  // 如果没有小数部分或小数部分全是0
  if (formattedDecimal === '') {
    return integerPart.toString();
  }
  
  return `${integerPart}.${formattedDecimal}`;
}

/**
 * 解析SUI代币金额为MIST单位
 * @param amount 以SUI为单位的金额字符串
 * @returns 以MIST为单位的BigInt
 */
export function parseSuiCoin(amount: string): bigint {
  if (!amount) return BigInt(0);
  
  const SUI_DECIMALS = 9;
  
  // 解析数字部分
  try {
    if (amount.includes('.')) {
      const [integerPart, decimalPart] = amount.split('.');
      // 确保小数部分不超过9位，多余的部分将被截断
      const paddedDecimal = (decimalPart || '').slice(0, SUI_DECIMALS).padEnd(SUI_DECIMALS, '0');
      
      return BigInt(integerPart) * BigInt(10 ** SUI_DECIMALS) + BigInt(paddedDecimal);
    } else {
      return BigInt(amount) * BigInt(10 ** SUI_DECIMALS);
    }
  } catch (error) {
    console.error('解析SUI金额错误:', error);
    return BigInt(0);
  }
} 