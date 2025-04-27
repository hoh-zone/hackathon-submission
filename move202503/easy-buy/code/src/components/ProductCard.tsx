import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useSendTransaction, useSwitchChain, useChainId } from 'wagmi';
import { parseEther } from 'viem';

export interface ProductCardProps {
  chainType: string;
  chainId?: number;
  price: string;
  recipientAddress: `0x${string}`;
  title: string;
  description: string;
  imageUrl: string;
  artist: string;
  collection: string;
}

const ProductCard = ({
  chainType,
  chainId,
  price,
  recipientAddress,
  title,
  description,
  imageUrl,
  artist,
  collection
}: ProductCardProps) => {
  const { isConnected } = useAccount();
  const { sendTransaction } = useSendTransaction();
  const { switchChain } = useSwitchChain();
  const currentChainId = useChainId();

  const handlePurchase = async () => {
    try {
      // 检查当前链ID是否与目标链ID匹配
      debugger
      if (chainId && currentChainId !== chainId) {
        // 如果不匹配，先切换链
        await switchChain({ chainId });
      }

      // 发送交易
      if (sendTransaction) {
        sendTransaction({
          to: recipientAddress,
          value: parseEther(price)
        });
      }
    } catch (error) {
      console.error('交易失败:', error);
    }
  };

  return (
    <div style={{ width: '32%', flex: '0 0 auto' }} className="bg-gradient-to-br from-yellow-800/20 to-yellow-600/10 rounded-xl overflow-hidden border border-yellow-600/30 shadow-lg">
      <div className="relative w-full h-48 overflow-hidden">
        <img
          className="w-full h-full object-cover"
          src={imageUrl}
          alt={title}
        />
        <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold z-10">
          {price} {chainType}
        </div>
        {chainId && (
          <div className="bg-gray-700 text-white px-3 py-1 rounded-full text-xs z-10">
            Chain ID: {chainId}
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="text-lg font-bold mb-2">{title}</h3>
        <p className="text-gray-300 text-sm mb-3 line-clamp-2">
          {description}
        </p>

        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs text-gray-300">
            <span>Artist</span>
            <span className="font-medium text-white">{artist}</span>
          </div>
          <div className="flex justify-between items-center text-xs text-gray-300">
            <span>Collection</span>
            <span className="font-medium text-white">{collection}</span>
          </div>

          <div className="pt-3 border-t border-gray-700">
            {isConnected ? (
              <button
                onClick={handlePurchase}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
              >
                Purchase for {price} {chainType}
              </button>
            ) : (
              <ConnectButton.Custom>
                {({ openConnectModal }) => (
                  <button
                    onClick={openConnectModal}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                  >
                    Connect Wallet to Purchase
                  </button>
                )}
              </ConnectButton.Custom>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
