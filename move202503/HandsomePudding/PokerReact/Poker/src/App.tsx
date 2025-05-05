import { ConnectButton } from "@mysten/dapp-kit";
import { useState, useRef, useEffect  } from "react";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import './css/App.css';
import { playGame, getPokerTokenBalance, getSuiBalance, buyPokerTokens, sellTokens, reward } from './contracts/poker';
import {suiClient} from "./config/index";

// 导入图片资源
import musicon from './assets/musicon.png';
import musicoff from './assets/musicoff.png';
import ruleIcon from './assets/rule.png';
import cardBack from './assets/card_b.png';
import cardFront from './assets/card_f.png';
import pokerToken from './assets/pokerToken.png';
import suiToken from './assets/suiToken.png';
import token1 from './assets/1.png';
import token10 from './assets/10.png';
import token100 from './assets/100.png';
import music_btn from './assets/music_btn.mp3';
import bet_music from './assets/bet_music.mp3';
import win from './assets/win.mp3';
import suit1 from './assets/1_0.png';
import suit2 from './assets/2_0.png';
import suit3 from './assets/3_0.png';
import suit4 from './assets/4_0.png';
import b1 from './assets/b_1.png';
import b2 from './assets/b_2.png';
import b3 from './assets/b_3.png';
import b4 from './assets/b_4.png';
import b5 from './assets/b_5.png';
import b6 from './assets/b_6.png';
import b7 from './assets/b_7.png';
import b8 from './assets/b_8.png';
import b9 from './assets/b_9.png';
import b10 from './assets/b_10.png';
import b11 from './assets/b_11.png';
import b12 from './assets/b_12.png';
import b13 from './assets/b_13.png';


import r1 from './assets/r_1.png';
import r2 from './assets/r_2.png';
import r3 from './assets/r_3.png';
import r4 from './assets/r_4.png';
import r5 from './assets/r_5.png';
import r6 from './assets/r_6.png';
import r7 from './assets/r_7.png';
import r8 from './assets/r_8.png';
import r9 from './assets/r_9.png';
import r10 from './assets/r_10.png';
import r11 from './assets/r_11.png';
import r12 from './assets/r_12.png';
import r13 from './assets/r_13.png';


interface TokenAnimation {
  id: number;
  amount: number;
  image: string;
  x: number;
  y: number;
  startX: number;
  startY: number;
}

interface GameResultEvent {
  final_balance: number;
  winner_region: number;
  prize: number;
  cards: {
    suit: number;
    value: number;
  }[];
}

function App() {
  const [selectedAmount, setSelectedAmount] = useState(1);
  const [mines, setMines] = useState([0, 0, 0, 0, 0]);
  const [isMusicOn, setIsMusicOn] = useState(() => {
    const savedMusicSetting = localStorage.getItem('isMusicOn');
    return savedMusicSetting ? JSON.parse(savedMusicSetting) : false;
  });
  const [showRules, setShowRules] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [suiBalance, setSuiBalance] = useState(0);
  const [selectedToken, setSelectedToken] = useState<number>(1);
  const [tokenAnimations, setTokenAnimations] = useState<{ [key: number]: TokenAnimation[] }>({
    0: [], 1: [], 2: [], 3: [], 4: []
  });
  const [gameResult, setGameResult] = useState<GameResultEvent | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [showResultPopup, setShowResultPopup] = useState(false);
  const [currentProfit, setCurrentProfit] = useState(0);
  const [lastBets, setLastBets] = useState<number[]>([0, 0, 0, 0, 0]);
  const [showSwap, setShowSwap] = useState(false);
  const [swapDirection, setSwapDirection] = useState<'SUI_TO_POKER' | 'POKER_TO_SUI'>('SUI_TO_POKER');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const EXCHANGE_RATE = 100;
  const [submitLoading, setSubmitLoading] = useState(false);
  const [lastTotalBet, setLastTotalBet] = useState(0);
  // 下注总额实时计算，供全组件使用
  const totalBet = mines.reduce((sum, mine) => sum + mine, 0);
  
  const account = useCurrentAccount();
  const {mutateAsync: signAndExecuteTransaction} = useSignAndExecuteTransaction({
    execute: async ({bytes, signature}) =>
        await suiClient.executeTransactionBlock({
            transactionBlock: bytes,
            signature,
            options: {
                showRawEffects: true,
                showEvents: true
            },
        })
});

  const handleBet = (amount: number) => {
    playButtonSound();
    setSelectedToken(amount);
    setSelectedAmount(amount);
  };

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const betAudioRef = useRef<HTMLAudioElement | null>(null);
  const winAudioRef = useRef<HTMLAudioElement | null>(null);

  const toggleMusic = () => {
    const newMusicState = !isMusicOn;
    setIsMusicOn(newMusicState);
    localStorage.setItem('isMusicOn', JSON.stringify(newMusicState));
  };

  const playButtonSound = () => {
    if (isMusicOn && audioRef.current) {
      audioRef.current.play();
    }
  };

  const playBetSound = () => {
    if (isMusicOn) {
      const audio = new Audio(bet_music);
      audio.volume = 0.5;
      audio.play();
    }
  };

  const playWinSound = () => {
    if (isMusicOn && winAudioRef.current) {
      winAudioRef.current.currentTime = 0;
      winAudioRef.current.play();
    }
  };

  useEffect(() => {
    audioRef.current = new Audio(music_btn);
    audioRef.current.volume = 0.5;
    winAudioRef.current = new Audio(win);
    winAudioRef.current.volume = 0.7;
  }, []);

  useEffect(() => {
    const fetchBalance = async () => {
      if (account) {
        try {
          const startTime = performance.now();
          const balance = await getPokerTokenBalance(account.address);
          const endTime = performance.now();
          console.log("POKERTOEN balance", balance);
          console.log(`getPokerTokenBalance execution time: ${(endTime - startTime).toFixed(2)}ms`);

          const suibalance = await getSuiBalance(account.address);
          console.log("suibalance balance", suibalance);

          setWalletBalance(balance);
          setSuiBalance(suibalance);
        } catch (error) {
          console.error("Error fetching balance:", error);
        }
      } else {
        setWalletBalance(0);
        setSuiBalance(0);
      }
    };

    fetchBalance();
  }, [account]);

  const getTokenImage = (amount: number) => {
    switch (amount) {
      case 1: return token1;
      case 10: return token10;
      case 100: return token100;
      default: return token1;
    }
  };

  const balanceDisplayRef = useRef<HTMLDivElement>(null);
  const cardSlotsRef = useRef<(HTMLDivElement | null)[]>([]);

  const handleCardClick = (index: number) => {
    if (selectedAmount > 0 && balanceDisplayRef.current && cardSlotsRef.current[index]) {
      // Check if user has enough balance
      if (walletBalance < selectedAmount) {
        return; // Don't allow betting if not enough balance
      }

      playBetSound(); // Play bet sound when placing a bet

      const balanceRect = balanceDisplayRef.current.getBoundingClientRect();
      const cardRect = cardSlotsRef.current[index]!.getBoundingClientRect();
      
      const startX = balanceRect.left - cardRect.left;
      const startY = balanceRect.top - cardRect.top;

      // Calculate random position within a wider area
      const randomX = Math.random() * 160 - 80; // Increased range from -80px to +80px
      const randomY = Math.random() * 100 - 50; // Increased range from -50px to +50px

      // Add new token animation
      const newAnimation: TokenAnimation = {
        id: Date.now(),
        amount: selectedAmount,
        image: getTokenImage(selectedAmount),
        startX,
        startY,
        x: randomX,
        y: randomY
      };

      // Update mines and deduct from wallet balance
      const newMines = [...mines];
      newMines[index] = mines[index] + selectedAmount;
      setMines(newMines);
      
      // Deduct from wallet balance
      setWalletBalance(prev => Number((prev - selectedAmount).toFixed(1)));

      setTokenAnimations(prev => ({
        ...prev,
        [index]: [...prev[index], newAnimation]
      }));
    }
  };

  const handleReset = () => {
    playButtonSound();
    // Calculate total bet amount
    const totalBet = mines.reduce((sum, mine) => sum + mine, 0);
    
    // Return bet amount to wallet balance
    setWalletBalance(prev => prev + totalBet);
    
    // Reset mines and animations
    setMines([0, 0, 0, 0, 0]);
    setTokenAnimations({
      0: [], 1: [], 2: [], 3: [], 4: []
    });
    
    // Hide results if they're showing
    setShowResults(false);
    setGameResult(null);
    setShowResultPopup(false);
  };

  const handleSubmit = async () => {
    if (submitLoading) return;
    setSubmitLoading(true);
    playButtonSound();
    try {
      const bet = mines.reduce((sum, mine) => sum + mine, 0);
      setLastTotalBet(bet);
      // Save current bet information
      setLastBets([...mines]);
      // Call playGame with all bet amounts
      const result = await playGame(
        signAndExecuteTransaction,
        mines[0],
        mines[1],
        mines[2],
        mines[3],
        mines[4],
        account?.address || ''
      ) as any;
      if (result) {
        setGameResult(result);
        // 本地计算盈亏
        const winBet = mines[result.winner_region] || 0;
        const profit = winBet > 0 ? winBet * 4.8 - bet : -bet;
        setCurrentProfit(profit);
        // 等待链上最新余额，延迟1.2秒后再查
        if (account?.address) {
          setTimeout(async () => {
            const latestBalance = await getPokerTokenBalance(account.address);
            setWalletBalance(latestBalance);
            setShowResults(true);
            setShowResultPopup(true);
          }, 500);
        } else {
          setShowResults(true);
          setShowResultPopup(true);
        }
        // Play win sound
        playWinSound();
        // Reset mines and animations after showing results
        setMines([0, 0, 0, 0, 0]);
        setTokenAnimations({
          0: [], 1: [], 2: [], 3: [], 4: []
        });
      }
    } catch (error) {
      console.error("Error submitting bets:", error);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleCloseResultPopup = () => {
    setShowResultPopup(false);
    setShowResults(false);
    setGameResult(null);
  };

  const handleRulesClick = () => {
    playButtonSound();
    setShowRules(true);
  };

  // Function to get suit image based on suit number
  const getSuitImage = (suit: number) => {
    switch(suit) {
      case 1: return suit1;
      case 2: return suit2;
      case 3: return suit3;
      case 4: return suit4;
      default: return suit1;
    }
  };

  // Function to get value image based on suit and value
  const getValueImage = (suit: number, value: number) => {
    // 如果suit是偶数(2,4)，使用黑色数值图片
    if (suit % 2 === 0) {
      switch(value) {
        case 1: return b1;
        case 2: return b2;
        case 3: return b3;
        case 4: return b4;
        case 5: return b5;
        case 6: return b6;
        case 7: return b7;
        case 8: return b8;
        case 9: return b9;
        case 10: return b10;
        case 11: return b11;
        case 12: return b12;
        case 13: return b13;
        default: return b1;
      }
    } 
    // 如果suit是奇数(1,3)，使用红色数值图片
    else {
      switch(value) {
        case 1: return r1;
        case 2: return r2;
        case 3: return r3;
        case 4: return r4;
        case 5: return r5;
        case 6: return r6;
        case 7: return r7;
        case 8: return r8;
        case 9: return r9;
        case 10: return r10;
        case 11: return r11;
        case 12: return r12;
        case 13: return r13;
        default: return r1;
      }
    }
  };

  // 输入与方向切换逻辑
  const handleFromAmountChange = (val: string) => {
    // 只允许数字和最多两位小数
    let formatted = val.replace(/^([0-9]+)(\.[0-9]{0,2})?.*$/, (m, int, dec) => int + (dec ? dec : ''));
    // 去除前导0
    if (formatted.length > 1 && formatted[0] === '0' && formatted[1] !== '.') {
      formatted = formatted.replace(/^0+/, '');
    }
    setFromAmount(formatted);
    if (swapDirection === 'SUI_TO_POKER') {
      setToAmount(formatted ? String(Math.floor(Number(formatted) * EXCHANGE_RATE)) : '');
    } else {
      setToAmount(formatted ? (parseInt(formatted, 10) / EXCHANGE_RATE).toFixed(2) : '');
    }
  };
  const handleSwitchDirection = () => {
    setSwapDirection(d => d === 'SUI_TO_POKER' ? 'POKER_TO_SUI' : 'SUI_TO_POKER');
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };
  const handleMax = () => {
    if (swapDirection === 'SUI_TO_POKER') {
      setFromAmount((suiBalance || 0).toString());
      setToAmount(((suiBalance || 0) * EXCHANGE_RATE).toString());
    } else {
      setFromAmount((walletBalance || 0).toString());
      setToAmount(((walletBalance || 0) / EXCHANGE_RATE).toString());
    }
  };
  const handleHalf = () => {
    if (swapDirection === 'SUI_TO_POKER') {
      setFromAmount(((suiBalance || 0) / 2).toString());
      setToAmount((((suiBalance || 0) / 2) * EXCHANGE_RATE).toString());
    } else {
      setFromAmount(((walletBalance || 0) / 2).toString());
      setToAmount((((walletBalance || 0) / 2) / EXCHANGE_RATE).toString());
    }
  };
  const handleSwap = async () => {
    playButtonSound();
    if (!fromAmount || parseFloat(fromAmount) <= 0) return;
    try {
      if (swapDirection === 'SUI_TO_POKER') {
        // 传递整数MIST
        const suiAmount = Math.floor(Number(fromAmount) * 1_000_000_000);
        const tx = await buyPokerTokens(suiAmount, account?.address || '');
        await signAndExecuteTransaction({transaction: tx});
      } else {
        // PokerToken 直接传整数
        const pokerAmount = Math.floor(Number(fromAmount) * 10);
        const tx = await sellTokens(pokerAmount, account?.address || '');
        await signAndExecuteTransaction({transaction: tx});
      }
      // 刷新余额
      if (account?.address) {
        const newPoker = await getPokerTokenBalance(account.address);
        const newSui = await getSuiBalance(account.address);
        setWalletBalance(newPoker);
        setSuiBalance(newSui);
        setSwapPokerBalance(newPoker);
        setSwapSuiBalance(newSui);
      }
      setFromAmount('');
      setToAmount('');
      setShowSwap(false);
    } catch (error) {
      console.error("Error swapping tokens:", error);
    }
  };

  const [swapSuiBalance, setSwapSuiBalance] = useState(0);
  const [swapPokerBalance, setSwapPokerBalance] = useState(0);
  const [showDonate, setShowDonate] = useState(false);
  const [donateAmount, setDonateAmount] = useState('');
  const [donateLoading, setDonateLoading] = useState(false);

  return (
    <div className="game-container">
      <div className="game-header">
        <div className="left-controls">
          <button className="icon-button" onClick={toggleMusic}>
            <img src={isMusicOn ? musicon : musicoff} alt="Music" />
          </button>
          <button className="icon-button" onClick={handleRulesClick}>
            <img src={ruleIcon} alt="Rules" />
          </button>
        </div>
        <div className="right-controls">
          <ConnectButton />
        </div>
      </div>

      {showRules && (
        <div className="rules-popup">
          <div className="rules-content">
            <h2>Game Rules</h2>
            <div className="rules-text">
              <p>1. Select the bet amount</p>
              <p>2. Click on any card to place a bet</p>
              <p>3. You can bet multiple times on each card</p>
              <p>4. Highest hand wins. Cards are ranked from lowest to highest: 2 to A, and when of equal rank, suits are ordered (highest to lowest) as Spades &gt; Hearts &gt; Clubs &gt; Diamonds.</p>
              <p>5. If you bet and win,the game coins you get will be the coins you bet on the game x 4.8</p>
            </div>
            <button className="close-button" onClick={() => setShowRules(false)}>Close</button>
          </div>
        </div>
      )}

      {showResultPopup && gameResult && (
        <div className="rules-popup result-overlay">
          <div className="rules-content result-content">
            <h2>Game Results</h2>
            <div className="results-cards">
              {gameResult.cards.map((card, index) => (
                <div 
                  key={index} 
                  className={`result-card-small ${gameResult.winner_region === index ? 'winner' : ''}`}
                >
                  <p className="region-name">Region {index + 1}</p>
                  <div className="bet-amount">Bet: {lastBets[index]}</div>
                  {gameResult.winner_region === index && (
                    <div className="winner-tag">Win</div>
                  )}
                </div>
              ))}
            </div>
            <div className="profit-summary">
              <div className={`profit-amount ${currentProfit >= 0 ? 'profit-positive' : 'profit-negative'}`}>
                {currentProfit >= 0 ? '+' : ''}{currentProfit.toFixed(1)}
                <span className="profit-label">{currentProfit >= 0 ? ' Profit' : ' Loss'}</span>
              </div>
              <div className="bet-details">
                <p>Total Bet: {lastTotalBet}</p>
                <p>New Balance: {walletBalance}</p>
              </div>
            </div>
            <button className="confirm-button" onClick={handleCloseResultPopup}>Confirm</button>
          </div>
        </div>
      )}

      <div className="cards-container">
        {[0, 1, 2, 3, 4].map((index) => (
          <div 
            key={index} 
            className={`card-slot ${showResults && gameResult && gameResult.winner_region === index ? 'winner-card' : ''}`}
            onClick={(e) => {
              // Ensure click event triggers in the entire area
              e.stopPropagation();
              handleCardClick(index);
            }}
            ref={el => cardSlotsRef.current[index] = el}
          >
            <div className="card-container">
              {showResults && gameResult ? (
                <div style={{ position: 'relative' }}>
                  <img src={cardFront} alt="Card Front" className="card" />
                  {/* Display suit image */}
                  <img 
                    src={getSuitImage(gameResult.cards[index].suit)} 
                    alt={`Suit ${gameResult.cards[index].suit}`}
                    style={{ 
                      position: 'absolute', 
                      top: '50%', 
                      left: '50%', 
                      transform: 'translate(-50%, -50%)',
                      width: '117.6px',
                      height: '157.2px'
                    }}
                  />
                  {/* Display value image */}
                  <img 
                    src={getValueImage(gameResult.cards[index].suit, gameResult.cards[index].value)} 
                    alt={`Value ${gameResult.cards[index].value}`}
                    style={{ 
                      position: 'absolute', 
                      top: '8px', 
                      left: '5px', 
                      width: '43.2px',
                      height: '51.6px'
                    }}
                  />
                  {/* Add winner indicator */}
                  {gameResult.winner_region === index && (
                    <div className="winner-badge">Win</div>
                  )}
                </div>
              ) : (
                <img src={cardBack} alt="Card" className="card" />
              )}
            </div>
            <div className="tokens-container">
              {tokenAnimations[index].map((animation) => (
                <img
                  key={animation.id}
                  src={animation.image}
                  alt={`Token ${animation.amount}`}
                  className="animated-token"
                  style={{
                    '--start-x': `${animation.startX}px`,
                    '--start-y': `${animation.startY}px`,
                    '--end-x': `${animation.x}px`,
                    '--end-y': `${animation.y}px`
                  } as React.CSSProperties}
                />
              ))}
            </div>
            <div className="card-info">
              <p className="mine-text">Mine: {mines[index]}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="controls-container">
        <div className="balance-section">
          <div className="balance-display" ref={balanceDisplayRef}>
            <img src={pokerToken} alt="Token" className="token-icon" />
            <span>{walletBalance}</span>
          </div>
          <button className="swap-button pretty-swap-btn" onClick={() => {
            playButtonSound();
            setSwapSuiBalance(suiBalance);
            setSwapPokerBalance(walletBalance);
            setShowSwap(true);
            // 异步刷新
            if (account?.address) {
              getSuiBalance(account.address).then(sui => setSwapSuiBalance(sui));
              getPokerTokenBalance(account.address).then(poker => setSwapPokerBalance(poker));
            }
          }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginRight: 6, verticalAlign: 'middle'}}><path d="M7 15L11 19L15 15" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M19 11V19H11" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M15 7L11 3L7 7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 11V3H11" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span style={{fontWeight: 600, fontSize: 18, verticalAlign: 'middle'}}>Swap</span>
          </button>
          <button className="donate-btn" onClick={() => { playButtonSound(); setShowDonate(true); }}>
            <svg width="30" height="30" viewBox="0 0 22 22" fill="none" style={{marginRight: 6, verticalAlign: 'middle'}} xmlns="http://www.w3.org/2000/svg">
              <path d="M11 19s-7-4.35-7-10A5 5 0 0 1 11 4a5 5 0 0 1 7 5c0 5.65-7 10-7 10z" fill="#fff" stroke="#ff7e5f" strokeWidth="2"/>
            </svg>
            Donate
          </button>
        </div>
        <div className="betting-controls">
          <button 
            className={`token-button ${selectedToken === 1 ? 'selected' : ''}`} 
            onClick={() => handleBet(1)}
          >
            <img src={token1} alt="1" />
          </button>
          <button 
            className={`token-button ${selectedToken === 10 ? 'selected' : ''}`} 
            onClick={() => handleBet(10)}
          >
            <img src={token10} alt="10" />
          </button>
          <button 
            className={`token-button ${selectedToken === 100 ? 'selected' : ''}`} 
            onClick={() => handleBet(100)}
          >
            <img src={token100} alt="100" />
          </button>
        </div>
        <div className="action-buttons">
          <button className="action-button pretty-reset-btn" onClick={handleReset} disabled={totalBet === 0}>
            Reset
          </button>
          <button className="action-button pretty-submit-btn" onClick={handleSubmit} disabled={submitLoading || totalBet === 0}>
            {submitLoading ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>

      {showSwap && (
        <style>{`
          .swap-modal input[type=number]::-webkit-inner-spin-button,
          .swap-modal input[type=number]::-webkit-outer-spin-button {
            -webkit-appearance: none;
            margin: 0;
          }
          .swap-modal input[type=number] {
            -moz-appearance: textfield;
          }
        `}</style>
      )}

      {showSwap && (
        <div className="swap-modal">
          <div className="swap-panel">
            <div className="swap-token-row">
              <div className="swap-label">From</div>
              <div className="swap-token-info">
                <input
                  type="number"
                  value={fromAmount}
                  onChange={e => handleFromAmountChange(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                />
                <img
                  src={swapDirection === 'SUI_TO_POKER' ? suiToken : pokerToken}
                  alt="from-token"
                  style={{ width: 32, height: 32, marginRight: 4, objectFit: 'contain', verticalAlign: 'middle' }}
                />
                <span className="swap-token-symbol">
                  {swapDirection === 'SUI_TO_POKER' ? 'SUI' : 'PokerToken'}
                </span>
              </div>
              <div className="swap-balance">
                Balance: {swapDirection === 'SUI_TO_POKER' ? swapSuiBalance : swapPokerBalance}
                <span className="swap-quick" onClick={handleHalf}>50%</span>
                <span className="swap-quick" onClick={handleMax}>MAX</span>
              </div>
            </div>
            <div className="swap-switch-row">
              <button className="swap-switch-btn" onClick={handleSwitchDirection}>⇅</button>
            </div>
            <div className="swap-token-row">
              <div className="swap-label">To</div>
              <div className="swap-token-info">
                <input
                  type="text"
                  value={toAmount}
                  readOnly
                  placeholder="0"
                />
                <img
                  src={swapDirection === 'SUI_TO_POKER' ? pokerToken : suiToken}
                  alt="to-token"
                  style={{ width: 32, height: 32, marginRight: 4, objectFit: 'contain', verticalAlign: 'middle' }}
                />
                <span className="swap-token-symbol">
                  {swapDirection === 'SUI_TO_POKER' ? 'PokerToken' : 'SUI'}
                </span>
              </div>
              <div className="swap-balance">
                Balance: {swapDirection === 'SUI_TO_POKER' ? swapPokerBalance : swapSuiBalance}
              </div>
            </div>
            <div className="swap-rate">1 SUI = 100 PokerToken</div>
            <div className="modal-buttons">
              <button className="confirm-button" onClick={handleSwap}>Swap</button>
              <button className="close-button" onClick={() => setShowSwap(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showDonate && (
        <div className="swap-modal donate-modal">
          <div className="swap-panel">
            <div className="swap-token-row">
              <div className="swap-label">Donate SUI</div>
              <div className="swap-token-info">
                <input
                  type="number"
                  value={donateAmount}
                  onChange={e => setDonateAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
                <img
                  src={suiToken}
                  alt="sui-token"
                  style={{ width: 32, height: 32, marginRight: 4, objectFit: 'contain', verticalAlign: 'middle' }}
                />
                <span className="swap-token-symbol">SUI</span>
              </div>
              <div className="swap-balance">
                Balance: {suiBalance}
              </div>
            </div>
            <div className="modal-buttons">
              <button className="confirm-button" disabled={donateLoading || !donateAmount || parseFloat(donateAmount) <= 0} onClick={async () => {
                if (!account?.address || !donateAmount || parseFloat(donateAmount) <= 0) return;
                setDonateLoading(true);
                try {
                  const suiAmount = Math.floor(Number(donateAmount) * 1_000_000_000);
                  const tx = await reward(suiAmount, account.address);
                  await signAndExecuteTransaction({transaction: tx});
                  // 刷新SUI余额
                  if (account.address) {
                    const newSui = await getSuiBalance(account.address);
                    setSuiBalance(newSui);
                  }
                  setShowDonate(false);
                  setDonateAmount('');
                } catch (e) {
                  console.error('Donate error', e);
                } finally {
                  setDonateLoading(false);
                }
              }}>{donateLoading ? 'Donating...' : 'Confirm'}</button>
              <button className="close-button" onClick={() => setShowDonate(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .pretty-swap-btn {
          background: linear-gradient(90deg, #4e8cff 0%, #6ec6ff 100%);
          color: #fff;
          border: none;
          border-radius: 18px;
          padding: 10px 22px 10px 16px;
          font-size: 18px;
          font-weight: 600;
          margin-left: 12px;
          box-shadow: 0 2px 8px rgba(78,140,255,0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s, box-shadow 0.2s, transform 0.1s;
          cursor: pointer;
          height: 60px;
          min-width: 80px;
        }
        .pretty-swap-btn:hover {
          background: linear-gradient(90deg, #6ec6ff 0%, #4e8cff 100%);
          box-shadow: 0 4px 16px rgba(78,140,255,0.18);
          transform: translateY(-2px) scale(1.04);
        }
        .pretty-reset-btn {
          background: linear-gradient(90deg, #ffb347 0%, #ffcc80 100%);
          color: #fff;
          border: none;
          border-radius: 18px;
          padding: 10px 32px;
          font-size: 18px;
          font-weight: 600;
          margin-right: 18px;
          box-shadow: 0 2px 8px rgba(255,179,71,0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s, box-shadow 0.2s, transform 0.1s;
          cursor: pointer;
          height: 60px;
          min-width: 100px;
        }
        .pretty-reset-btn:hover {
          background: linear-gradient(90deg, #ffcc80 0%, #ffb347 100%);
          box-shadow: 0 4px 16px rgba(255,179,71,0.18);
          transform: translateY(-2px) scale(1.04);
        }
        .pretty-submit-btn {
          background: linear-gradient(90deg, #43e97b 0%, #38f9d7 100%);
          color: #fff;
          border: none;
          border-radius: 18px;
          padding: 10px 32px;
          font-size: 18px;
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(67,233,123,0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s, box-shadow 0.2s, transform 0.1s;
          cursor: pointer;
          height: 60px;
          min-width: 100px;
        }
        .pretty-submit-btn:hover {
          background: linear-gradient(90deg, #38f9d7 0%, #43e97b 100%);
          box-shadow: 0 4px 16px rgba(67,233,123,0.18);
          transform: translateY(-2px) scale(1.04);
        }
        .pretty-reset-btn:disabled,
        .pretty-submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          filter: grayscale(0.4);
        }
        .donate-modal input[type=number]::-webkit-inner-spin-button,
        .donate-modal input[type=number]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .donate-modal input[type=number] {
          -moz-appearance: textfield;
        }
        .donate-btn {
          background: linear-gradient(90deg, #ff7e5f 0%, #feb47b 100%);
          color: #fff;
          border: none;
          border-radius: 18px;
          padding: 10px 22px 10px 16px;
          font-size: 18px;
          font-weight: 600;
          margin-left: 12px;
          box-shadow: 0 2px 8px rgba(255,126,95,0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s, box-shadow 0.2s, transform 0.1s;
          cursor: pointer;
          height: 60px;
          min-width: 80px;
        }
        .donate-btn:hover {
          background: linear-gradient(90deg, #feb47b 0%, #ff7e5f 100%);
          box-shadow: 0 4px 16px rgba(255,126,95,0.18);
          transform: translateY(-2px) scale(1.04);
        }
      `}</style>
    </div>
  );
}

export default App;
