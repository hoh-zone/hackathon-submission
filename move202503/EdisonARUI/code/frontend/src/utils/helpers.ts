export const formatNumber = (num: number, decimals = 2) => {
  return num.toFixed(decimals);
};

export const formatAddress = (address: string) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export default {
  formatNumber,
  formatAddress,
};
