import React, { useState, useEffect, useRef } from 'react';
import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { useCurrentAccount, useSuiClient, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import CryptoJS from 'crypto-js';

function App() {
    const currentAccount = useCurrentAccount();
    const suiClient = useSuiClient();
    const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
    const [tab, setTab] = useState('create');
    const [title, setTitle] = useState('');
    const [options, setOptions] = useState([]);
    const [vote, setVote] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [enclavePk, setEnclavePk] = useState(null);
    const canvasRef = useRef(null);

    // 验证环境变量
    useEffect(() => {
        const requiredEnvVars = {
            REACT_APP_PACKAGE_ID: 'Package ID',
            REACT_APP_VOTE_OBJECT_ID: 'Vote Object ID',
            REACT_APP_ENCLAVE_OBJECT_ID: 'Enclave Object ID',
            REACT_APP_ENCLAVE_ADDRESS: 'Enclave Address',
            REACT_APP_TALLY_OBJECT_ID: 'Tally Object ID',
        };
        const missingVars = Object.entries(requiredEnvVars)
            .filter(([key]) => !process.env[key] || process.env[key].includes('YOUR_'))
            .map(([_, name]) => name);
        if (missingVars.length > 0) {
            setMessage(`⚠️ 缺失或无效的环境变量：${missingVars.join(', ')}。请在 .env 文件中配置正确的 Sui 对象 ID（从你的 Sui 智能合约或区块链浏览器获取）。`);
        }
    }, []);

    // 检查 OKX 钱包和连接状态
    useEffect(() => {
        // 延迟 1 秒检测，等待扩展注入
        const timer = setTimeout(() => {
            if (!window.okxwallet || !window.okxwallet.sui) {
                setMessage('⚠️ 未检测到 OKX 钱包扩展。请确保已安装并启用 OKX 钱包（https://www.okx.com/web3）。步骤：1. 访问 Chrome 网上应用店安装 OKX Wallet（https://chrome.google.com/webstore/detail/okx-wallet/mcohilncbfahbmgdjkbpemcciiolgcge）；2. 启用扩展（chrome://extensions/）；3. 确保已连接到 Sui 测试网；4. 刷新页面。');
            } else if (currentAccount) {
                setMessage(`🎉 钱包连接成功：${currentAccount.address.slice(0, 6)}...${currentAccount.address.slice(-4)}`);
            } else {
                setMessage('请点击右上角按钮连接 OKX 钱包');
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, [currentAccount]);

    // 背景动画
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const fontSize = 16;
        const columns = Math.floor(canvas.width / fontSize);
        const drops = Array(columns).fill(1);

        const draw = () => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'rgba(100, 150, 200, 0.3)';
            ctx.font = `${fontSize}px monospace`;

            for (let i = 0; i < drops.length; i++) {
                const text = chars.charAt(Math.floor(Math.random() * chars.length));
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);
                if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
                drops[i]++;
            }
            animationFrameId = requestAnimationFrame(draw);
        };

        draw();
        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    // 获取 Enclave 公钥
    useEffect(() => {
        const fetchEnclavePk = async () => {
            try {
                const enclaveObjectId = process.env.REACT_APP_ENCLAVE_OBJECT_ID;
                if (!enclaveObjectId || enclaveObjectId.includes('YOUR_')) {
                    throw new Error('Invalid Enclave Object ID');
                }
                const enclaveData = await suiClient.getObject({
                    id: enclaveObjectId,
                    options: { showContent: true },
                });
                if (!enclaveData?.data?.content?.fields?.pk) {
                    throw new Error('Enclave public key not found');
                }
                setEnclavePk(enclaveData.data.content.fields.pk);
            } catch (error) {
                console.error('Fetch enclave PK error:', error);
                setMessage(`⚠️ 获取Enclave公钥失败：${error.message}`);
            }
        };
        if (process.env.REACT_APP_ENCLAVE_OBJECT_ID && !process.env.REACT_APP_ENCLAVE_OBJECT_ID.includes('YOUR_')) {
            fetchEnclavePk();
        }
    }, [suiClient]);

    // 获取投票数据
    useEffect(() => {
        const fetchVoteData = async () => {
            try {
                const voteObjectId = process.env.REACT_APP_VOTE_OBJECT_ID;
                if (!voteObjectId || voteObjectId.includes('YOUR_')) {
                    throw new Error('Invalid Vote Object ID');
                }
                const voteData = await suiClient.getObject({
                    id: voteObjectId,
                    options: { showContent: true },
                });
                if (!voteData?.data?.content?.fields) {
                    throw new Error('Vote data not found');
                }
                const { title, options } = voteData.data.content.fields;
                setTitle(String.fromCharCode(...title));
                setOptions(options.map(opt => String.fromCharCode(...opt)));
            } catch (error) {
                console.error('Fetch vote data error:', error);
                setMessage(`⚠️ 获取投票数据失败：${error.message}`);
            }
        };
        if (process.env.REACT_APP_VOTE_OBJECT_ID && !process.env.REACT_APP_VOTE_OBJECT_ID.includes('YOUR_')) {
            fetchVoteData();
        }
    }, [suiClient]);

    const addOption = () => {
        setOptions([...options, '']);
    };

    const updateOption = (index, value) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const removeOption = (index) => {
        if (options.length > 2) {
            setOptions(options.filter((_, i) => i !== index));
        } else {
            setMessage('⚠️ 至少需要两个选项！');
        }
    };

    const createVote = async () => {
        if (!title.trim()) {
            setMessage('⚠️ 请输入投票标题！');
            return;
        }
        if (options.length < 2 || options.some(opt => !opt.trim())) {
            setMessage('⚠️ 请至少提供两个有效选项！');
            return;
        }
        if (!currentAccount) {
            setMessage('⚠️ 请先连接钱包！');
            return;
        }
        setLoading(true);
        setMessage('');
        try {
            const tx = new Transaction();
            tx.moveCall({
                package: process.env.REACT_APP_PACKAGE_ID,
                module: 'voting',
                function: 'create_vote',
                arguments: [
                    tx.pure(Array.from(title.trim()).map(c => c.charCodeAt(0))),
                    tx.pure(options.map(opt => Array.from(opt.trim()).map(c => c.charCodeAt(0)))),
                    tx.pure(process.env.REACT_APP_ENCLAVE_ADDRESS),
                ],
            });
            signAndExecuteTransaction(
                {
                    transaction: tx,
                    chain: 'sui:testnet',
                },
                {
                    onSuccess: () => {
                        setMessage('🎉 投票创建成功！');
                        setTimeout(() => window.location.reload(), 1000);
                    },
                    onError: (error) => {
                        throw error;
                    },
                }
            );
        } catch (error) {
            console.error('Create vote error:', error);
            setMessage(`⚠️ 创建投票失败：${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleVote = async () => {
        if (!vote) {
            setMessage('⚠️ 请选择一个选项！');
            return;
        }
        if (!currentAccount) {
            setMessage('⚠️ 请先连接钱包！');
            return;
        }
        if (!enclavePk) {
            setMessage('⚠️ Enclave公钥未加载！');
            return;
        }
        setLoading(true);
        setMessage('');
        try {
            const encryptedVote = CryptoJS.AES.encrypt(vote, enclavePk).toString();
            if (!encryptedVote) {
                throw new Error('Vote encryption failed');
            }
            const tx = new Transaction();
            tx.moveCall({
                package: process.env.REACT_APP_PACKAGE_ID,
                module: 'voting',
                function: 'submit_vote',
                arguments: [
                    tx.object(process.env.REACT_APP_ENCLAVE_OBJECT_ID),
                    tx.pure(encryptedVote),
                ],
            });
            signAndExecuteTransaction(
                {
                    transaction: tx,
                    chain: 'sui:testnet',
                },
                {
                    onSuccess: () => {
                        setMessage(`🎉 投票提交成功：${vote}！`);
                        setVote('');
                    },
                    onError: (error) => {
                        throw error;
                    },
                }
            );
        } catch (error) {
            console.error('Submit vote error:', error);
            setMessage(`⚠️ 投票提交失败：${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const checkResults = async () => {
        setLoading(true);
        setMessage('');
        try {
            const tallyObjectId = process.env.REACT_APP_TALLY_OBJECT_ID;
            if (!tallyObjectId || tallyObjectId.includes('YOUR_')) {
                throw new Error('Invalid Tally Object ID');
            }
            const tallyData = await suiClient.getObject({
                id: tallyObjectId,
                options: { showContent: true },
            });
            if (!tallyData?.data?.content?.fields?.result) {
                throw new Error('Tally result not found');
            }
            const result = tallyData.data.content.fields.result;
            setMessage(`🌟 投票结果：${JSON.stringify(result, null, 2)}`);
        } catch (error) {
            console.error('Check results error:', error);
            setMessage(`⚠️ 获取投票结果失败：${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // 手动连接逻辑
    const handleConnect = async () => {
        console.log('Manual connect triggered');
        if (!window.okxwallet || !window.okxwallet.sui) {
            setMessage('⚠️ 未检测到 OKX 钱包扩展。请确保已安装并启用 OKX 钱包（https://www.okx.com/web3）。步骤：1. 访问 Chrome 网上应用店安装 OKX Wallet（https://chrome.google.com/webstore/detail/okx-wallet/mcohilncbfahbmgdjkbpemcciiolgcge）；2. 启用扩展（chrome://extensions/）；3. 确保已连接到 Sui 测试网；4. 刷新页面。');
            return;
        }
        try {
            await window.okxwallet.sui.connect();
            setMessage('🎉 钱包连接成功！');
        } catch (error) {
            console.error('Manual connect error:', error);
            setMessage(`⚠️ 连接失败：${error.message}`);
        }
    };

    // 手动断开连接逻辑
    const handleDisconnect = async () => {
        console.log('Manual disconnect triggered');
        if (!window.okxwallet || !window.okxwallet.sui) {
            setMessage('⚠️ 未检测到 OKX 钱包扩展。');
            return;
        }
        try {
            await window.okxwallet.sui.disconnect();
            setMessage('🎉 钱包已断开连接！');
        } catch (error) {
            console.error('Manual disconnect error:', error);
            setMessage(`⚠️ 断开连接失败：${error.message}`);
        }
    };

    return (
        <div className="relative min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-black">
            <canvas ref={canvasRef} className="absolute inset-0 z-0" />
            <div className="absolute top-4 right-4 z-20 flex items-center space-x-2">
                {currentAccount ? (
                    <>
                        <button
                            onClick={handleDisconnect}
                            className="bg-gradient-to-r from-[#ff4444] to-[#cc0000] px-4 py-2 rounded-md hover:from-[#ff6666] hover:to-[#ff3333] text-white font-semibold disabled:opacity-50"
                        >
                            Disconnect
                        </button>
                        <span className="text-white text-sm font-mono">
                            {currentAccount.address.slice(0, 6)}...${currentAccount.address.slice(-4)}
                        </span>
                    </>
                ) : (
                    <button
                        onClick={handleConnect}
                        className="bg-gradient-to-r from-[#00C2FF] to-[#0077FF] px-4 py-2 rounded-md hover:from-[#00aaff] hover:to-[#0055ff] text-white font-semibold disabled:opacity-50"
                    >
                        Connect Wallet
                    </button>
                )}
            </div>
            <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
                <div className="bg-gray-900/80 backdrop-blur-xl shadow-2xl rounded-3xl p-8 max-w-lg w-full transform transition-all duration-700 hover:scale-105">
                    <div className="flex justify-center mb-6">
                        <button
                            onClick={() => setTab('create')}
                            className={`px-4 py-2 mr-2 ${tab === 'create' ? 'bg-gradient-to-r from-gray-600 to-teal-600' : 'bg-gray-700'} text-white rounded-xl`}
                        >
                            创建投票
                        </button>
                        <button
                            onClick={() => setTab('vote')}
                            className={`px-4 py-2 ${tab === 'vote' ? 'bg-gradient-to-r from-gray-600 to-teal-600' : 'bg-gray-700'} text-white rounded-xl`}
                        >
                            参与投票
                        </button>
                    </div>
                    {tab === 'create' ? (
                        <>
                            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-300 to-blue-300 text-center mb-8 tracking-wider animate-pulse">
                                🕵️ 创建匿名投票
                            </h1>
                            <div className="mb-8">
                                <label className="block text-gray-300 font-semibold text-xl mb-2" htmlFor="title">
                                    投票标题：
                                </label>
                                <input
                                    id="title"
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="输入投票标题"
                                    className="w-full p-3 rounded-xl bg-gray-800 text-white border border-gray-600 focus:outline-none focus:border-blue-400 disabled:opacity-50"
                                    disabled={loading}
                                />
                            </div>
                            <div className="mb-8">
                                <label className="block text-gray-300 font-semibold text-xl mb-2">
                                    投票选项：
                                </label>
                                {options.map((option, index) => (
                                    <div key={`option-${index}`} className="flex items-center space-x-2 mb-2">
                                        <input
                                            type="text"
                                            value={option}
                                            onChange={(e) => updateOption(index, e.target.value)}
                                            placeholder={`选项 ${index + 1}`}
                                            className="flex-1 p-3 rounded-xl bg-gray-800 text-white border border-gray-600 focus:outline-none focus:border-blue-400 disabled:opacity-50"
                                            disabled={loading}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeOption(index)}
                                            className="p-2 bg-red-600 rounded-xl text-white hover:bg-red-700 transition-all duration-300 disabled:opacity-50"
                                            disabled={loading || options.length <= 2}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={addOption}
                                    className="mt-2 py-2 px-4 bg-gradient-to-r from-gray-700 to-blue-600 rounded-xl text-white font-semibold hover:from-gray-800 hover:to-blue-700 transition-all duration-300 disabled:opacity-50"
                                    disabled={loading}
                                >
                                    添加选项 ➕
                                </button>
                            </div>
                            <button
                                onClick={createVote}
                                className="w-full py-4 px-6 bg-gradient-to-r from-gray-700 to-teal-600 rounded-xl text-white font-semibold text-lg shadow-lg hover:shadow-xl hover:from-gray-800 hover:to-teal-700 transition-all duration-300 disabled:opacity-50"
                                disabled={loading}
                            >
                                {loading ? '创建中...' : '创建投票 🗳️'}
                            </button>
                        </>
                    ) : (
                        <>
                            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-300 to-blue-300 text-center mb-8 tracking-wider animate-pulse">
                                🕵️ 匿名投票
                            </h1>
                            <div className="mb-8">
                                <label className="block text-gray-300 font-semibold text-xl mb-4">
                                    选择您的选项：
                                </label>
                                {options.map((option, index) => (
                                    <button
                                        key={`vote-option-${index}`}
                                        onClick={() => setVote(option)}
                                        className={`w-full py-4 px-6 rounded-xl text-white font-serif text-lg shadow-lg transition-all duration-300 ${
                                            vote === option
                                                ? 'bg-gradient-to-r from-gray-600 to-blue-600 animate-pulse'
                                                : 'bg-gradient-to-r from-gray-700 to-gray-500 hover:from-gray-600 hover:to-blue-600'
                                        } border-2 border-transparent hover:border-blue-400 disabled:opacity-50`}
                                        disabled={loading}
                                    >
                                        {option} 🕵️‍♂️
                                    </button>
                                ))}
                            </div>
                            <div className="flex space-x-4">
                                <button
                                    onClick={handleVote}
                                    className="w-1/2 py-4 px-6 bg-gradient-to-r from-gray-700 to-teal-600 rounded-xl text-white font-semibold text-lg shadow-lg hover:shadow-xl hover:from-gray-800 hover:to-teal-700 transition-all duration-300 disabled:opacity-50"
                                    disabled={loading || !vote}
                                >
                                    提交投票 🕵️‍♀️
                                </button>
                                <button
                                    onClick={checkResults}
                                    className="w-1/2 py-4 px-6 bg-gradient-to-r from-gray-700 to-blue-600 rounded-xl text-white font-semibold text-lg shadow-lg hover:shadow-xl hover:from-gray-800 hover:to-blue-700 transition-all duration-300 disabled:opacity-50"
                                    disabled={loading}
                                >
                                    查看结果 🕵️
                                </button>
                            </div>
                        </>
                    )}
                    {loading && (
                        <div className="mt-6 text-center text-white bg-gradient-to-r from-gray-800 to-gray-900 p-6 rounded-2xl shadow-inner animate-pulse">
                            正在处理... ⏳
                        </div>
                    )}
                    {message && !loading && (
                        <p className="mt-6 text-center text-white bg-gradient-to-r from-gray-800 to-gray-900 p-6 rounded-2xl shadow-inner animate-fade-in">
                            {message}
                        </p>
                    )}
                </div>
            </div>
            <div className="absolute top-12 left-12 w-24 h-24 bg-blue-400/20 rounded-full blur-lg animate-blob"></div>
            <div className="absolute bottom-12 right-12 w-32 h-32 bg-gray-400/20 rounded-full blur-lg animate-blob animation-delay-2000"></div>
        </div>
    );
}

export default App;