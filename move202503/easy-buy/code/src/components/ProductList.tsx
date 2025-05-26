import React, { useState, useEffect } from 'react';
import ProductItem from './ProductItem';
import PurchaseModal from './PurchaseModal';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useBalance, useDisconnect } from 'wagmi';
import {useAccountBalance, useWallet as useSuiWallet, ConnectModal } from '@suiet/wallet-kit';
import { Connection, PublicKey, LAMPORTS_PER_SOL, clusterApiUrl } from '@solana/web3.js';
import {MIST_PER_SUI} from "@mysten/sui/utils";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number; // USD价格
  imageUrl: string;
}

const sampleProducts: Product[] = [
  {
    id: 'prod-001',
    name: 'Celestial Harmony',
    description: 'Rare digital artwork inspired by cosmic nebulae, with animated elements',
    price: 0.01,
    imageUrl: 'https://images.unsplash.com/photo-1634986666676-ec8fd927c23d?w=800&auto=format&fit=crop'
  },
  {
    id: 'prod-002',
    name: 'Quantum Avatar',
    description: 'AI-generated avatar with unique traits and cross-platform compatibility',
    price: 0.01,
    imageUrl: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=800&auto=format&fit=crop'
  },
  {
    id: 'prod-003',
    name: 'Genesis Parcel',
    description: 'Prime virtual real estate in the heart of the metaverse with development rights',
    price: 0.01,
    imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop'
  },
	{
		id: 'prod-001',
		name: 'Celestial Harmony',
		description: 'Rare digital artwork inspired by cosmic nebulae, with animated elements',
		price: 0.01,
		imageUrl: 'https://images.unsplash.com/photo-1634986666676-ec8fd927c23d?w=800&auto=format&fit=crop'
	},
	{
		id: 'prod-002',
		name: 'Quantum Avatar',
		description: 'AI-generated avatar with unique traits and cross-platform compatibility',
		price: 15,
		imageUrl: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=800&auto=format&fit=crop'
	},
	{
		id: 'prod-003',
		name: 'Genesis Parcel',
		description: 'Prime virtual real estate in the heart of the metaverse with development rights',
		price: 50,
		imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop'
	},
	{
		id: 'prod-001',
		name: 'Celestial Harmony',
		description: 'Rare digital artwork inspired by cosmic nebulae, with animated elements',
		price: 25,
		imageUrl: 'https://images.unsplash.com/photo-1634986666676-ec8fd927c23d?w=800&auto=format&fit=crop'
	},
	{
		id: 'prod-002',
		name: 'Quantum Avatar',
		description: 'AI-generated avatar with unique traits and cross-platform compatibility',
		price: 15,
		imageUrl: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=800&auto=format&fit=crop'
	},
	{
		id: 'prod-003',
		name: 'Genesis Parcel',
		description: 'Prime virtual real estate in the heart of the metaverse with development rights',
		price: 50,
		imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop'
	},
	{
		id: 'prod-001',
		name: 'Celestial Harmony',
		description: 'Rare digital artwork inspired by cosmic nebulae, with animated elements',
		price: 25,
		imageUrl: 'https://images.unsplash.com/photo-1634986666676-ec8fd927c23d?w=800&auto=format&fit=crop'
	},
	{
		id: 'prod-002',
		name: 'Quantum Avatar',
		description: 'AI-generated avatar with unique traits and cross-platform compatibility',
		price: 15,
		imageUrl: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=800&auto=format&fit=crop'
	},
	{
		id: 'prod-003',
		name: 'Genesis Parcel',
		description: 'Prime virtual real estate in the heart of the metaverse with development rights',
		price: 50,
		imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop'
	}
];

// Phantom wallet type definition
interface PhantomWindow extends Window {
  solana?: {
    isPhantom?: boolean;
    connect: () => Promise<{ publicKey: { toString: () => string } }>;
    disconnect: () => Promise<void>;
    signAndSendTransaction: (transaction: any) => Promise<any>;
    publicKey: { toString: () => string } | null;
  };
}

declare const window: PhantomWindow;

const ProductList = () => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
	const [showSuiWallet, setShowSuiWallet] = useState(false)
  // Ethereum wallet state
  const { address: ethAddress, isConnected: isEthConnected } = useAccount();
  const { data: ethBalance } = useBalance({ address: ethAddress });
  const { disconnect: disconnectEth } = useDisconnect();

  // Solana wallet state
  const [solanaConnected, setSolanaConnected] = useState(false);
  const [solanaPublicKey, setSolanaPublicKey] = useState<string | null>(null);
  const [solanaBalance, setSolanaBalance] = useState<number | null>(null);
  const [solanaLoading, setSolanaLoading] = useState(false);

  // Sui wallet state
  const suiWallet = useSuiWallet();
	const { balance: suiBalance } = useAccountBalance();

  // 处理购买按钮点击
  const handleBuyClick = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // Solana wallet functions
  const connectSolanaWallet = async () => {
    if (!window.solana) {
      alert('Please install Phantom wallet extension!');
      return;
    }

    try {
      setSolanaLoading(true);
      const response = await window.solana.connect();
      setSolanaConnected(true);
      setSolanaPublicKey(response.publicKey.toString());
      fetchSolanaBalance(response.publicKey.toString());
    } catch (error) {
      console.error('Failed to connect Solana wallet:', error);
    } finally {
      setSolanaLoading(false);
    }
  };

  const disconnectSolanaWallet = async () => {
    if (window.solana) {
      try {
        await window.solana.disconnect();
        setSolanaConnected(false);
        setSolanaPublicKey(null);
        setSolanaBalance(null);
      } catch (error) {
        console.error('Failed to disconnect Solana wallet:', error);
      }
    }
  };

	let mainnetRpc = 'https://mainnet.helius-rpc.com/?api-key=07347831-5ce8-4dd1-810c-e1c95b2801bd';
  const fetchSolanaBalance = async (publicKey: string) => {
    try {
	    const connection = new Connection(mainnetRpc, {
		    commitment: 'processed',
	    });
	    const balance = await connection.getBalance(new PublicKey(publicKey));
      setSolanaBalance(balance / LAMPORTS_PER_SOL);
    } catch (error) {
      console.error('Failed to fetch Solana balance:', error);
    }
  };

  // Check Solana wallet connection on load
  useEffect(() => {
    const checkSolanaWallet = () => {
      if (window.solana && window.solana.publicKey) {
        setSolanaConnected(true);
        setSolanaPublicKey(window.solana.publicKey.toString());
        fetchSolanaBalance(window.solana.publicKey.toString());
      }
    };

    checkSolanaWallet();
  }, []);

  // Format address for display
  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className="pb-12">
      <a
        href="https://example.com/promotion"
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full h-[100px] mb-8 relative overflow-hidden group"
      >
        <img
          src="https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=1600&auto=format&fit=crop"
          alt="Special Promotion"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      </a>

      <div className="flex flex-col md:flex-row justify-between mb-8 gap-3">
        <div className="flex gap-4 flex-shrink-0 justify-between items-center">
          <h2 className="text-3xl font-bold text-black">Easy Buy</h2>
        </div>
        <p className="text-gray-600 text-sm max-w-2xl md:text-left text-center flex-1">This is your streamlined on-chain asset gateway: leveraging live exchange rates to turn "cross-chain swap + transfer" into a single "cross-chain transfer."</p>
      </div>

      {/* Wallet Connection Section */}
      <div className="flex flex-wrap justify-center gap-6 mb-[30px]">
	      {/* Sui Wallet */}
	      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 w-[220px] transition-all duration-300 hover:shadow-xl relative">
		      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-400 to-teal-600"></div>
		      <div className="justify-center p-4 bg-teal-50 border-b border-gray-200 flex items-center">
			      <div className="w-[16px] mr-[4px] h-10 bg-teal-100 rounded-full flex items-center justify-center mr-3">
				      <img src={"/sui-icon.svg"} />
			      </div>
			      <h3 className="font-medium text-gray-900">Sui</h3>
		      </div>
		      <div className="p-4 flex justify-center items-center min-h-[100px]">
			      {suiWallet.connected ? (
				      <div className="space-y-3 flex justify-center items-center  flex-wrap">
					      <div className="flex justify-between items-center">
						      <span className="text-sm text-gray-500">Address: </span>
						      <span className="text-sm font-medium bg-teal-50 border-teal-100 px-3 py-1 rounded-full truncate max-w-[220px]">
                    {formatAddress(suiWallet.address || '')}
                  </span>
					      </div>
					      <div className="flex justify-between items-center">
						      <span className="text-sm text-gray-500">Balance: </span>
						      <span className="text-sm font-medium bg-teal-100 border-teal-200 px-3 py-1 rounded-full">
                    {/* Sui wallet kit doesn't provide balance directly, would need to fetch it */}
							      {Number(((suiBalance || BigInt(0)) / MIST_PER_SUI)).toFixed(2) } SUI
                  </span>
					      </div>
					      <div className="flex justify-between items-center">
						      <button
							      onClick={() => suiWallet.disconnect()}
							      className="mt-3 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-300 text-sm font-medium shadow-sm hover:shadow transform hover:scale-[1.02] active:scale-[0.98] connect-btn"
						      >
							      Disconnect
						      </button>
					      </div>
				      </div>
			      ) : (
				      <div className="min-[100px] flex justify-center items-center w-full">
					      <ConnectModal
						      open={showSuiWallet}
						      onOpenChange={(open: any) => setShowSuiWallet(open)}
					      >
						      <button
							      // onClick={() => suiWallet.select && suiWallet.select('Suiet')}
							      onClick={() => {

							      }}
							      className="px-4 py-2 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg hover:from-teal-600 hover:to-teal-700 transition-all duration-300 font-medium shadow-sm hover:shadow transform hover:scale-[1.02] active:scale-[0.98] connect-btn"
						      >
							      Connect
						      </button>
					      </ConnectModal>
				      </div>
			      )}
		      </div>
	      </div>

        {/* Ethereum Wallet */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 w-[180px] transition-all duration-300 hover:shadow-xl">
          <div className="justify-center p-4 bg-yellow-50 border-b border-gray-200 flex items-center">
            <div className="w-[20px] h-10 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
              <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z" />
              </svg>
            </div>
            <h3 className="font-medium text-gray-900">EVM</h3>
          </div>
          <div className="p-4 flex justify-center items-center min-h-[100px]">
            {isEthConnected ? (
              <div className="space-y-3 flex justify-center items-center  flex-wrap">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Address:</span>
                  <span className="text-sm font-medium bg-yellow-50 px-3 py-1 rounded-full truncate max-w-[180px]">
                    {formatAddress(ethAddress || '')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Balance: </span>
                  <span className="text-sm font-medium bg-yellow-100 px-3 py-1 rounded-full">
                    {ethBalance ? `${Number.parseFloat(ethBalance?.formatted).toFixed(4)} ${ethBalance?.symbol}` : '0'}
                  </span>
                </div>
	              <div className="flex justify-between items-center">
		              <button
			              onClick={() => disconnectEth()}
			              className="mt-3 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-300 text-sm font-medium shadow-sm hover:shadow transform hover:scale-[1.02] active:scale-[0.98] connect-btn"
		              >
			              Disconnect
		              </button>
	              </div>
              </div>
            ) : (
              <div className="flex justify-center items-center w-full">
	              <ConnectButton.Custom>
		              {({
			                account,
			                chain,
			                openAccountModal,
			                openChainModal,
			                openConnectModal,
			                authenticationStatus,
			                mounted,
		                }) => {
			              // Note: If your app doesn't use authentication, you
			              // can remove all 'authenticationStatus' checks
			              const ready = mounted && authenticationStatus !== 'loading';
			              const connected =
				              ready &&
				              account &&
				              chain &&
				              (!authenticationStatus ||
					              authenticationStatus === 'authenticated');

			              return (
				              <div
					              {...(!ready && {
						              'aria-hidden': true,
						              'style': {
							              opacity: 0,
							              pointerEvents: 'none',
							              userSelect: 'none',
						              },
					              })}
				              >
					              {(() => {
						              if (!connected) {
							              return (
								              <button className="connect-btn" onClick={openConnectModal} type="button">
									              Connect
								              </button>
							              );
						              }

						              if (chain.unsupported) {
							              return (
								              <button onClick={openChainModal} type="button">
									              Wrong network
								              </button>
							              );
						              }

						              return (
							              <div style={{ display: 'flex', gap: 12 }}>
								              <button
									              onClick={openChainModal}
									              style={{ display: 'flex', alignItems: 'center' }}
									              type="button"
								              >
									              {chain.hasIcon && (
										              <div
											              style={{
												              background: chain.iconBackground,
												              width: 12,
												              height: 12,
												              borderRadius: 999,
												              overflow: 'hidden',
												              marginRight: 4,
											              }}
										              >
											              {chain.iconUrl && (
												              <img
													              alt={chain.name ?? 'Chain icon'}
													              src={chain.iconUrl}
													              style={{ width: 12, height: 12 }}
												              />
											              )}
										              </div>
									              )}
									              {chain.name}
								              </button>

								              <button onClick={openAccountModal} type="button">
									              {account.displayName}
									              {account.displayBalance
										              ? ` (${account.displayBalance})`
										              : ''}
								              </button>
							              </div>
						              );
					              })()}
				              </div>
			              );
		              }}
	              </ConnectButton.Custom>
              </div>
            )}
          </div>
        </div>

        {/* Solana Wallet */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 w-[220px] transition-all duration-300 hover:shadow-xl relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-purple-600"></div>
          <div className="justify-center p-4 bg-purple-50 border-b border-gray-200 flex items-center">
            <div className="w-[16px] h-10 mr-[4px] bg-purple-100 rounded-full flex items-center justify-center mr-3">
	            <img src={"/sol-icon.svg"} />
            </div>
            <h3 className="font-medium text-gray-900">Solana</h3>
          </div>
          <div className="p-4 flex justify-center items-center min-h-[100px]">
            {solanaConnected ? (
              <div className="space-y-3 flex justify-center items-center  flex-wrap">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Address</span>
                  <span className="text-sm font-medium bg-purple-50  border-purple-100 px-3 py-1 rounded-full truncate max-w-[220px]">
                    {formatAddress(solanaPublicKey || '')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Balance</span>
                  <span className="text-sm font-medium bg-purple-100  border-purple-200 px-3 py-1 rounded-full">
                    {solanaBalance !== null ? `${solanaBalance.toFixed(4)} SOL` : '0 SOL'}
                  </span>
                </div>
	              <div className="flex justify-between items-center">
		              <button
			              onClick={disconnectSolanaWallet}
			              className="mt-3 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-300 text-sm font-medium shadow-sm hover:shadow transform hover:scale-[1.02] active:scale-[0.98] connect-btn"
		              >
			              Disconnect
		              </button>
	              </div>
              </div>
            ) : (
              <div className="min-[100px] flex justify-center items-center">
                <button
                  onClick={connectSolanaWallet}
                  disabled={solanaLoading}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-300 font-medium shadow-sm hover:shadow transform hover:scale-[1.02] active:scale-[0.98] connect-btn"
                >
                  {solanaLoading ? 'Connecting...' : 'Connect'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-row flex-wrap gap-6">
        {sampleProducts.map((product) => (
          <ProductItem
            key={product.id}
            product={product}
            onBuyClick={() => handleBuyClick(product)}
          />
        ))}
      </div>

      {isModalOpen && selectedProduct && (
        <PurchaseModal
          product={selectedProduct}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default ProductList;
