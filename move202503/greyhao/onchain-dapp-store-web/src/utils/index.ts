
export const formateAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
}

export const formateDate = (timestamp: string) => {
  const date = new Date(Number(timestamp));
  const formatter = new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    // hour: '2-digit',
    // minute: '2-digit',
    // second: '2-digit',
  });
  return formatter.format(date);
}