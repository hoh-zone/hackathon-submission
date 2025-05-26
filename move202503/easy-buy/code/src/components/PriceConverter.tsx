import { useState, useEffect } from 'react';

interface PriceConverterProps {
  onPriceChange: (prices: { eth: string; solana: string; sui: string }) => void;
}

interface TokenPrices {
  eth: number;
  solana: number;
  sui: number;
}

interface CoinDeskApiResponse {
  Data: {
    [key: string]: {
	    BEST_ASK: number;
    }
  }
}

const PriceConverter = ({ onPriceChange }: PriceConverterProps) => {
  const [usdAmount, setUsdAmount] = useState<string>('10');
  const [prices, setPrices] = useState<TokenPrices>({
    eth: 0,
    solana: 0,
    sui: 0
  });
  const [loading, setLoading] = useState<boolean>(true);

  // 从CoinDesk API获取代币价格
  const fetchTokenPrices = async () => {
    try {
      setLoading(true);
      // 使用CoinDesk API获取实时价格数据
      const response = await fetch('https://data-api.coindesk.com/spot/v1/latest/tick?instruments=ETH-USD,SUI-USD,SOL-USD&apply_mapping=true&market=coinbase');
      const data: CoinDeskApiResponse = await response.json();

      // 提取价格数据
      const realPrices = {
        eth: data.Data['ETH-USD']?.BEST_ASK || 500, // 如果API没有返回eth价格，使用默认值
        solana: data.Data['SOL-USD']?.BEST_ASK || 150,
        sui: data.Data['SUI-USD']?.BEST_ASK || 2.5
      };

      console.log('获取到的价格数据:', realPrices);
      setPrices(realPrices);

      // 计算并更新各代币对应的价格
      updateTokenAmounts(usdAmount, realPrices);
    } catch (error) {
      console.error('获取代币价格失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 计算代币数量
  const updateTokenAmounts = (amount: string, tokenPrices: TokenPrices) => {
    const usd = Number.parseFloat(amount) || 1;

    const tokenAmounts = {
      eth: (usd / tokenPrices.eth).toFixed(6),
      solana: (usd / tokenPrices.solana).toFixed(6),
      sui: (usd / tokenPrices.sui).toFixed(6)
    };

    onPriceChange(tokenAmounts);
  };

  // 处理输入变化
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsdAmount(value);
    updateTokenAmounts(value || '1', prices);
  };

  // 组件挂载时获取价格
  useEffect(() => {
    fetchTokenPrices();
    const interval = setInterval(() => {
	    fetchTokenPrices()
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gray-800/50 rounded-xl p-6 mb-8 border border-gray-700">
      <h2 className="text-xl font-semibold mb-4">设置价格</h2>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="w-full md:w-1/2">
          <label htmlFor="usdAmount" className="block text-sm font-medium text-gray-300 mb-2">
            美元金额 (USD)
          </label>
          <div className="relative">
            <input
              type="number"
              id="usdAmount"
              value={usdAmount}
              onChange={handleAmountChange}
              className="bg-gray-700 border border-gray-600 text-white rounded-lg block w-full pl-12 pr-12 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="$输入美元金额"
              min="0"
              step="0.01"
            />
          </div>
        </div>

        <div className="w-full md:w-1/2 grid grid-cols-3 gap-3 text-center">
          <div className="bg-gradient-to-br from-yellow-800/20 to-yellow-600/10 p-3 rounded-lg border border-yellow-600/30">
            <div className="text-xs text-gray-300 mb-1">ETH</div>
            <div className="font-bold text-yellow-400">
              {loading ? '加载中...' : (Number.parseFloat(usdAmount) / prices.eth).toFixed(6)}
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-800/20 to-purple-600/10 p-3 rounded-lg border border-purple-600/30">
            <div className="text-xs text-gray-300 mb-1">SOL</div>
            <div className="font-bold text-purple-400">
              {loading ? '加载中...' : (Number.parseFloat(usdAmount) / prices.solana).toFixed(6)}
            </div>
          </div>

          <div className="bg-gradient-to-br from-teal-800/20 to-teal-600/10 p-3 rounded-lg border border-teal-600/30">
            <div className="text-xs text-gray-300 mb-1">SUI</div>
            <div className="font-bold text-teal-400">
              {loading ? '加载中...' : (Number.parseFloat(usdAmount) / prices.sui).toFixed(6)}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-400">
        <p>价格数据仅供参考，实际价格可能会有波动。</p>
        <p className="mt-1">最后更新时间: {new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  );
};

export default PriceConverter;
