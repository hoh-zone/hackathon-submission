import { ConnectButton } from "@mysten/dapp-kit";
import { useState, useRef, useEffect  } from "react";
import { useCurrentAccount, useSuiClient, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import './css/App.css';
import { getBalance, addBalance, playGame} from './contracts/poker';
import {suiClient} from "./config/index";

// 导入图片资源
import musicon from './assets/musicon.png';
import musicoff from './assets/musicoff.png';
import ruleIcon from './assets/rule.png';
import cardBack from './assets/card_b.png';
import cardFront from './assets/card_f.png';
import suiToken from './assets/suiToken.png';
import token1 from './assets/1.png';
import token10 from './assets/10.png';
import token100 from './assets/100.png';
import submitButton from './assets/submit.png';
import resetButton from './assets/reset.png';
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
  const [selectedToken, setSelectedToken] = useState<number>(1);
  const [tokenAnimations, setTokenAnimations] = useState<{ [key: number]: TokenAnimation[] }>({
    0: [], 1: [], 2: [], 3: [], 4: []
  });
  const [showAddCoins, setShowAddCoins] = useState(false);
  const [coinsToAdd, setCoinsToAdd] = useState('');
  const [gameResult, setGameResult] = useState<GameResultEvent | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [showResultPopup, setShowResultPopup] = useState(false);
  const [currentProfit, setCurrentProfit] = useState(0);
  const [totalBet, setTotalBet] = useState(0);
  const [lastBets, setLastBets] = useState<number[]>([0, 0, 0, 0, 0]);
  
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
          // 从localStorage获取所有钱包余额
          const savedBalances = JSON.parse(localStorage.getItem('walletBalances') || '{}');
          const address = account.address.toLowerCase(); // 统一转换为小写
          
          console.log("savedBalances", savedBalances);
          console.log("address", address);
          
          // 检查当前钱包地址是否有保存的余额
          const savedBalance = Object.entries(savedBalances).find(([key]) => 
            key.toLowerCase() === address
          );
          
          if (savedBalance) {
            const balanceValue = Number(savedBalance[1]);
            console.log("savedBalance", balanceValue);
            setWalletBalance(balanceValue);
            return;
          }

          // 如果没有保存的余额，则调用合约获取
          const balance = await getBalance(signAndExecuteTransaction);
          console.log("balance", balance);
          setWalletBalance(balance);
          
          // 更新localStorage中的余额
          savedBalances[address] = balance;
          localStorage.setItem('walletBalances', JSON.stringify(savedBalances));
        } catch (error) {
          console.error("Error fetching balance:", error);
        }
      } else {
        setWalletBalance(0);
      }
    };

    fetchBalance();
  }, [account, signAndExecuteTransaction]);

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
    playButtonSound();
    try {
      // Calculate total bet amount
      const bet = mines.reduce((sum, mine) => sum + mine, 0);
      setTotalBet(bet);
      
      // Save current bet information
      setLastBets([...mines]);
      
      // Call playGame with all bet amounts
      const result = await playGame(
        signAndExecuteTransaction,
        mines[0],
        mines[1],
        mines[2],
        mines[3],
        mines[4]
      ) as unknown as GameResultEvent | undefined;
      
      if (result) {
        // Store the result and show it
        setGameResult(result);
        setShowResults(true);
        
        // Calculate profit = prize - total bet
        const profit = result.prize - bet;
        setCurrentProfit(profit);
        
        // Show result popup
        setShowResultPopup(true);
        
        // Play win sound
        playWinSound();
        
        // Update wallet balance with final_balance from game result
        setWalletBalance(result.final_balance);
        
        // Update localStorage
        if (account) {
          const savedBalances = JSON.parse(localStorage.getItem('walletBalances') || '{}');
          savedBalances[account.address.toLowerCase()] = result.final_balance;
          localStorage.setItem('walletBalances', JSON.stringify(savedBalances));
        }
        
        // Reset mines and animations after showing results
        setMines([0, 0, 0, 0, 0]);
        setTokenAnimations({
          0: [], 1: [], 2: [], 3: [], 4: []
        });
      }
    } catch (error) {
      console.error("Error submitting bets:", error);
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

  const handleAddCoins = async () => {
    playButtonSound();
    if (!coinsToAdd || parseInt(coinsToAdd) <= 0) return;
    
    try {
      const newBalance = await addBalance(signAndExecuteTransaction, parseInt(coinsToAdd));
      setWalletBalance(newBalance);
      
      // Update localStorage
      if (account) {
        const savedBalances = JSON.parse(localStorage.getItem('walletBalances') || '{}');
        savedBalances[account.address.toLowerCase()] = newBalance;
        localStorage.setItem('walletBalances', JSON.stringify(savedBalances));
      }
      
      setShowAddCoins(false);
      setCoinsToAdd('');
    } catch (error) {
      console.error("Error adding coins:", error);
    }
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

      {showAddCoins && (
        <div className="rules-popup">
          <div className="rules-content">
            <h2>Get Game Coins</h2>
            <div className="add-coins-input">
              <input
                type="number"
                value={coinsToAdd}
                onChange={(e) => setCoinsToAdd(e.target.value)}
                placeholder="Enter amount"
                min="1"
              />
            </div>
            <div className="modal-buttons">
              <button className="confirm-button" onClick={handleAddCoins}>Confirm</button>
              <button className="close-button" onClick={() => {
                setShowAddCoins(false);
                setCoinsToAdd('');
              }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Game results popup */}
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
                <p>Total Bet: {totalBet}</p>
                <p>New Balance: {gameResult.final_balance}</p>
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
          <img src={suiToken} alt="Token" className="token-icon" />
            <span>{walletBalance}</span>
          </div>
          <button className="add-coins-button" onClick={() => {
            playButtonSound();
            setShowAddCoins(true);
          }}>
          Claim Coins
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
          <button className="action-button" onClick={handleReset}>
            <img src={resetButton} alt="Reset" />
          </button>
          <button className="action-button" onClick={handleSubmit}>
            <img src={submitButton} alt="Submit" />
        </button>
        </div>
      </div>
    </div>
  );
}

export default App;
