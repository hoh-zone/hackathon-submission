import React, {useState, useEffect, useRef} from 'react';
import { useAccount, useSendTransaction, useSwitchChain, useBalance } from 'wagmi';
import { parseEther } from 'viem';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import {useAccountBalance, useWallet as useSuiWallet} from '@suiet/wallet-kit';
import { Transaction as SuiTransaction } from '@mysten/sui/transactions';
import { Connection, PublicKey, Transaction as SolanaTransaction, SystemProgram, LAMPORTS_PER_SOL, clusterApiUrl } from '@solana/web3.js';
import { Product } from './ProductList';
import {MIST_PER_SUI} from "@mysten/sui/utils";
import axios from 'axios'
// Phantom wallet type
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

interface PurchaseModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

type BlockchainType = 'eth' | 'solana' | 'sui';

interface TokenPrices {
  eth: number;
  solana: number;
  sui: number;
}

const PurchaseModal = ({ product, isOpen, onClose }: PurchaseModalProps) => {
  const [selectedChain, setSelectedChain] = useState<BlockchainType>('sui');
  const [loading, setLoading] = useState(false);

	const fetchPrices = async() => {
		const data = await axios.get('https://data-api.coindesk.com/spot/v1/latest/tick?market=coinbase&instruments=SUI-USD,ETH-USD,SOL-USD&apply_mapping=false')

		const pricesData = data.data.Data
		setPrices({
			eth: pricesData['ETH-USD'].PRICE || 0,
			solana: pricesData['SOL-USD'].PRICE || 0,
			sui: pricesData['SUI-USD'].PRICE || 0
		})
	}

	let timer:any = useRef(null)
	useEffect(() => {
		fetchPrices()
		timer.current = setInterval(() => {
			fetchPrices()
		}, 30000)

		return () => {
			clearInterval(timer.current)
		}
	}, [])

  const [prices, setPrices] = useState<TokenPrices>({
    eth: 0, // Default price, will be replaced by API data
    solana: 0,
    sui: 0
  });
  const [tokenAmount, setTokenAmount] = useState('0');

  // ETH wallet status
  const { address: ethAddress, isConnected: isEthConnected } = useAccount();
  const { sendTransactionAsync } = useSendTransaction();
  const { switchChain } = useSwitchChain();
  const { data: ethBalance } = useBalance({ address: ethAddress });

  // Sui wallet status
  const suiWallet = useSuiWallet();

  // Solana wallet status
	const mainnetRpc = 'https://mainnet.helius-rpc.com/?api-key=07347831-5ce8-4dd1-810c-e1c95b2801bd';
  const [solanaConnected, setSolanaConnected] = useState(false);
  const [solanaPublicKey, setSolanaPublicKey] = useState<string | null>(null);
  const [solanaBalance, setSolanaBalance] = useState<number | null>(null);
	const { balance: suiBalance } = useAccountBalance();

  // Check Solana wallet connection status
  useEffect(() => {
    const checkSolanaWallet = () => {
      if (window.solana && window.solana.publicKey) {
        setSolanaConnected(true);
        setSolanaPublicKey(window.solana.publicKey.toString());
        fetchSolanaBalance(window.solana.publicKey.toString());
      }
    };

    checkSolanaWallet();
  }, [selectedChain]);

  // Fetch Solana balance
  const fetchSolanaBalance = async (publicKey: string) => {
    try {
      const connection = new Connection(mainnetRpc, {
				commitment: 'processed',
      });
      const balance = await connection.getBalance(new PublicKey(publicKey));
			console.log({ balance })
      setSolanaBalance(balance / LAMPORTS_PER_SOL);
    } catch (error) {
      console.error('Failed to fetch Solana balance:', error);
    }
  };

  // Connect Solana wallet
  const connectSolanaWallet = async () => {
    if (!window.solana) {
      alert('Please install Phantom wallet extension!');
      return;
    }

    try {
      setLoading(true);
      const response = await window.solana.connect();
      setSolanaConnected(true);
      setSolanaPublicKey(response.publicKey.toString());
      fetchSolanaBalance(response.publicKey.toString());
    } catch (error) {
      console.error('Failed to connect Solana wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch token prices
  useEffect(() => {
    const fetchTokenPrices = async () => {
      try {
        const response = await fetch('https://data-api.coindesk.com/spot/v1/latest/tick?instruments=ETH-USD,SOL-USD,SUI-USD&apply_mapping=true&market=coinbase');
        const data = await response.json();

        const realPrices = {
          eth: data.Data['ETH-USD']?.BEST_ASK || 3000,
          solana: data.Data['SOL-USD']?.BEST_ASK || 150,
          sui: data.Data['SUI-USD']?.BEST_ASK || 2.5
        };

        setPrices(realPrices);
        updateTokenAmount(realPrices);
      } catch (error) {
        console.error('Failed to fetch token prices:', error);
      }
    };

    fetchTokenPrices();
  }, [product]);

  // Update token amount
  const updateTokenAmount = (tokenPrices: TokenPrices) => {
    setTokenAmount((product.price / tokenPrices[selectedChain]).toFixed(6));
  };

  // Switch blockchain
  useEffect(() => {
    updateTokenAmount(prices);
  }, [selectedChain]);

  // Handle purchase
  const handlePurchase = async () => {
    setLoading(true);

    try {
      switch (selectedChain) {
        case 'eth':
          await handleEthPurchase();
          break;
        case 'solana':
          await handleSolanaPurchase();
          break;
        case 'sui':
          await handleSuiPurchase();
          break;
      }
    } catch (error) {
      console.error('Purchase failed:', error);
      alert('Purchase failed, please try again');
    } finally {
      setLoading(false);
    }
  };

  // ETH purchase logic
  const handleEthPurchase = async () => {
    if (!isEthConnected) throw new Error('ETH wallet not connected');

    try {
	    // Here should be the actual purchase logic, e.g. calling contract
	    // Here simplified as direct transfer
	    await sendTransactionAsync({
		    to: '0xb51b48008453213C78F9A3e65985776Ee17ccA65', // Recipient address
		    value: parseEther(tokenAmount)
	    });

	    alert('Purchase successful!');
	    onClose();
    } catch(err) {
	    alert('Purchase failed, please try again');
    }
  };

  // Solana purchase logic
  const handleSolanaPurchase = async () => {
    if (!solanaConnected || !solanaPublicKey) {
      throw new Error('Solana wallet not connected');
    }

    try {
      const connection = new Connection(mainnetRpc, {
				commitment: 'processed',
			});

      // Create transaction
      const transaction = new SolanaTransaction().add(
        SystemProgram.transfer({
          fromPubkey: new PublicKey(solanaPublicKey),
          toPubkey: new PublicKey('Bf1qfj9ATZZQPYTvJEYjpumaKzpXDkH6Cq7i6XHG5nza'), // Recipient address
          lamports: Math.floor(Number.parseFloat(tokenAmount) * LAMPORTS_PER_SOL)
        })
      );

      // Get latest block hash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = new PublicKey(solanaPublicKey);

      // Send transaction
      if (!window.solana) throw new Error('Phantom wallet not installed');

      const signed = await window.solana.signAndSendTransaction(transaction);

      // Wait for transaction confirmation
      await connection.confirmTransaction(signed.signature);

      console.log('Solana transaction successful:', signed.signature);

	    alert('Purchase successful!');
	    onClose();
    } catch (error) {
	    console.error('Purchase failed:', error);
	    alert('Purchase failed, please try again');
    }
  };

  // Sui purchase logic
  const handleSuiPurchase = async () => {
    if (!suiWallet.connected) {
      alert('Please connect Sui wallet first');
      return;
    }

    try {
      setLoading(true);

      // Create transaction
	    const tx = new SuiTransaction();

	    const amount = (Number(tokenAmount) * Number(MIST_PER_SUI)).toFixed(0)
	    const [coin] = tx.splitCoins(tx.gas, [amount]);

	    tx.transferObjects([coin], "0x73f1994d596eaa98fab2c7b2a40d91a2f2eaf2e9a5dedbf4f6289db945a6b8f4");
      // Execute transaction - use type assertion to resolve type mismatch
      const response = await suiWallet.signAndExecuteTransaction({
        transaction: tx,
      });

      alert(`Purchase successful! Transaction hash: ${response.digest}`);
      onClose();
    } catch (error) {
      console.error('Sui purchase failed:', error);
      alert('Purchase failed, please try again');
    } finally {
      setLoading(false);
    }
  };

  // Check if current chain wallet is connected
  const isWalletConnected = () => {
    switch (selectedChain) {
      case 'eth':
        return isEthConnected;
      case 'solana':
        return solanaConnected;
      case 'sui':
        return suiWallet.connected;
      default:
        return false;
    }
  };

  // Get current chain balance
  const getBalanceDisplay = () => {
    switch (selectedChain) {
      case 'eth':
        return ethBalance ? `${Number.parseFloat(ethBalance.formatted).toFixed(4)} ETH` : 'Loading...';
      case 'solana':
        return solanaBalance !== null ? `${solanaBalance.toFixed(4)} SOL` : 'Loading...';
      case 'sui':
        // Sui wallet balance needs to be fetched from suiWallet.getBalance(), simplified here
        return Number(((suiBalance || BigInt(0)) / MIST_PER_SUI)).toFixed(2) + ' SUI'
      default:
        return 'Unknown';
    }
  };

  // Render connect wallet button
  const renderConnectButton = () => {
    switch (selectedChain) {
      case 'eth':
        return <ConnectButton.Custom>
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
                      <button className="connect-btn w-full" onClick={openConnectModal} type="button">
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
        </ConnectButton.Custom>;
      case 'solana':
        return (
          <button
            onClick={connectSolanaWallet}
            className="w-full connect-btn"
          >
            {loading ? 'Connecting...' : 'Connect'}
          </button>
        );
      case 'sui':
        return (
          <button
            onClick={() => suiWallet.select && suiWallet.select('Suiet')}
            disabled={loading}
            className="w-full connect-btn"
          >
            {loading ? 'Connecting...' : 'Connect'}
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`purchase-modal pl-[10px] fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      onClick={onClose}
    >
      <div
        className={`fixed right-0 top-0 bottom-0 shadow-2xl w-[350px] max-w-[90vw] overflow-y-auto overflow-x-hidden transition-all duration-300 transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
        <div className="p-6 relative overflow-hidden">


          <div className="flex justify-between items-center mb-6 relative z-10">
            <h3 className="text-xl font-bold text-black">Purchase Product</h3>
            <button
              onClick={onClose}
              className="text-gray-500 p-1.5 cursor-pointer bg-transparent transition-all border-none"
            >
              <svg width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M5.29289 5.29289C5.68342 4.90237 6.31658 4.90237 6.70711 5.29289L12 10.5858L17.2929 5.29289C17.6834 4.90237 18.3166 4.90237 18.7071 5.29289C19.0976 5.68342 19.0976 6.31658 18.7071 6.70711L13.4142 12L18.7071 17.2929C19.0976 17.6834 19.0976 18.3166 18.7071 18.7071C18.3166 19.0976 17.6834 19.0976 17.2929 18.7071L12 13.4142L6.70711 18.7071C6.31658 19.0976 5.68342 19.0976 5.29289 18.7071C4.90237 18.3166 4.90237 17.6834 5.29289 17.2929L10.5858 12L5.29289 6.70711C4.90237 6.31658 4.90237 5.68342 5.29289 5.29289Z" fill="#0F1729"/>
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-4 mb-6 bg-gray-100 p-4 rounded-xl relative z-10">
            <div className="relative flex-shrink-0">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-[80px] h-[80px] rounded-lg object-cover ring-2 ring-gray-700/50 shadow-lg"
              />
            </div>
            <div>
              <h4 className="text-black font-bold mb-1 pl-[20px]">{product.name}</h4>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-5 mb-6 relative z-10">
            <div className="flex justify-between items-center mb-[10px] mt-[20px]">
              <span className="text-gray-700">Select Payment Chain</span>
            </div>
            <div className="flex gap-2 mb-[20px]">
	            <button
		            onClick={() => setSelectedChain('sui')}
		            className={`w-[29%] mr-[10px]  p-3 rounded-lg border transition-all duration-200 ${
			            selectedChain === 'sui'
				            ? 'chain-active'
				            : ''
		            }`}
	            >
		            <div className="flex flex-col items-center">
			            <img className="h-[60px]" src={"/sui-icon.svg"}/>
			            <span className="text-xs font-medium">Sui</span>
		            </div>
	            </button>
              <button
                onClick={() => setSelectedChain('eth')}
                className={`w-[29%] mr-[10px] p-[10px] rounded-lg border transition-all duration-200 ${
                  selectedChain === 'eth'
                    ? 'chain-active'
                    : ''
                }`}
              >
                <div className="flex flex-col items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-[60px] mb-1 " viewBox="0 0 32 32" fill="none">
                    <path d="M16 32C24.8366 32 32 24.8366 32 16C32 7.16344 24.8366 0 16 0C7.16344 0 0 7.16344 0 16C0 24.8366 7.16344 32 16 32Z" fill="#627EEA"/>
                    <path d="M16.498 4V12.87L23.995 16.22L16.498 4Z" fill="white" fillOpacity="0.6"/>
                    <path d="M16.498 4L9 16.22L16.498 12.87V4Z" fill="white"/>
                    <path d="M16.498 21.968V27.995L24 17.616L16.498 21.968Z" fill="white" fillOpacity="0.6"/>
                    <path d="M16.498 27.995V21.967L9 17.616L16.498 27.995Z" fill="white"/>
                    <path d="M16.498 20.573L23.995 16.22L16.498 12.872V20.573Z" fill="white" fillOpacity="0.2"/>
                    <path d="M9 16.22L16.498 20.573V12.872L9 16.22Z" fill="white" fillOpacity="0.6"/>
                  </svg>
                  <span className="text-xs font-medium">ETH</span>
                </div>
              </button>
              <button
                onClick={() => setSelectedChain('solana')}
                className={`w-[29%] mr-[10px] p-3 rounded-lg border transition-all duration-200 ${
                  selectedChain === 'solana'
                    ? 'chain-active'
                    : ''
                }`}
              >
                <div className="flex flex-col items-center">
                  <img className="h-[40px] pb-[10px] pt-[10px]" src={"/sol-icon.svg"}/>
                  <span className="text-xs font-medium">Solana</span>
                </div>
              </button>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-5 mb-6 relative z-10">
            <div className="flex justify-between items-center mb-3">
              <span className="text-gray-700 flex items-center">
                Payment amount
              </span>
              <div className="font-medium text-blue-700 bg-blue-50 px-3 py-1 rounded-full text-sm">
                {tokenAmount} <span className="font-bold">{selectedChain.toUpperCase()}</span>
              </div>
            </div>
            <div className="h-px bg-gradient-to-r from-transparent via-gray-700/50 to-transparent my-3"></div>
            <div className="flex justify-between items-center text-sm mb-2">
              <span className="text-gray-600">USD price</span>
              <span className="text-gray-800 font-medium">${product.price.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Current rate</span>
              <span className="text-gray-800">1 {selectedChain.toUpperCase()} = <span className="text-blue-600">${prices[selectedChain].toFixed(2)}</span></span>
            </div>
          </div>

          {isWalletConnected() && (
            <div className="bg-gray-50 rounded-xl p-5 mb-6 relative z-10">
              <div className="flex justify-between items-center">
                <span className="text-gray-700 flex items-center">
                  Balance:
                </span>
                <span className="font-medium text-gray-800 bg-gray-100 px-3 py-1 rounded-full text-sm">{getBalanceDisplay()}</span>
              </div>
            </div>
          )}

          <div className="relative z-10">
            {isWalletConnected() ? (
              <button
                onClick={handlePurchase}
                disabled={loading}
                className={`connect-btn w-full mt-[20px] ${
                  selectedChain === 'eth'
                    ? 'bg-transparent border-2 border-blue-500 text-blue-400 hover:bg-blue-500/10'
                    : selectedChain === 'solana'
                    ? 'bg-transparent border-2 border-purple-500 text-purple-400 hover:bg-purple-500/10'
                    : 'bg-transparent border-2 border-teal-500 text-teal-400 hover:bg-teal-500/10'
                } transform hover:scale-[1.02] active:scale-[0.98]`}
              >
                {loading ? (
                  <>
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Buy Now</span>
                )}
              </button>
            ) : (
              renderConnectButton()
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseModal;
