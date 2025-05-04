import React, { useState } from 'react';
import { useSuiStory } from './hooks/useSuiStoryWithWalrus';
import { useWallet, ConnectButton } from '@suiet/wallet-kit';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Story from './pages/Story';
import BookDetail from './pages/Story/Detail';

function App() {
  const {
    createStoryWithWalrus,
    addParagraph,
    startVoting,
    castVote,
    completeStory,
    getStory,
    getEvents,
  } = useSuiStory();
  // 创建故事
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loadingCreate, setLoadingCreate] = useState(false);
  // 添加段落
  const [storyIdPara, setStoryIdPara] = useState('');
  const [paraContentHash, setParaContentHash] = useState('');
  const [paraWalrusId, setParaWalrusId] = useState('');
  const [loadingPara, setLoadingPara] = useState(false);
  // 开始投票
  const [storyIdVote, setStoryIdVote] = useState('');
  const [proposalsHash, setProposalsHash] = useState('');
  const [proposalsWalrusId, setProposalsWalrusId] = useState('');
  const [votingDuration, setVotingDuration] = useState('');
  const [loadingStartVote, setLoadingStartVote] = useState(false);
  // 投票
  const [storyIdCast, setStoryIdCast] = useState('');
  const [proposalIndex, setProposalIndex] = useState('');
  const [loadingCast, setLoadingCast] = useState(false);
  // 完成故事
  const [storyIdComplete, setStoryIdComplete] = useState('');
  const [loadingComplete, setLoadingComplete] = useState(false);
  // 查询故事
  const [storyIdQuery, setStoryIdQuery] = useState('');
  const [loadingQuery, setLoadingQuery] = useState(false);
  // 查询事件
  const [eventType, setEventType] = useState('');
  const [loadingEvent, setLoadingEvent] = useState(false);
  // 结果
  const [result, setResult] = useState('');

  // 创建故事（自动上传内容到 Walrus）
  const handleCreateStory = async () => {
    setResult('');
    setLoadingCreate(true);
    try {
      const res = await createStoryWithWalrus(title, content);
      setResult(JSON.stringify(res, null, 2));
    } catch (e: any) {
      setResult(e.message || String(e));
    }
    setLoadingCreate(false);
  };

  // 添加段落
  const handleAddParagraph = async () => {
    setResult('');
    setLoadingPara(true);
    try {
      const res = await addParagraph(storyIdPara, paraContentHash, paraWalrusId);
      setResult(JSON.stringify(res, null, 2));
    } catch (e: any) {
      setResult(e.message || String(e));
    }
    setLoadingPara(false);
  };

  // 开始投票
  const handleStartVoting = async () => {
    setResult('');
    setLoadingStartVote(true);
    try {
      const hashArr = proposalsHash.split(',').map(s => s.trim());
      const walrusArr = proposalsWalrusId.split(',').map(s => s.trim());
      const duration = Number(votingDuration);
      const res = await startVoting(storyIdVote, hashArr, walrusArr, duration);
      setResult(JSON.stringify(res, null, 2));
    } catch (e: any) {
      setResult(e.message || String(e));
    }
    setLoadingStartVote(false);
  };

  // 投票
  const handleCastVote = async () => {
    setResult('');
    setLoadingCast(true);
    try {
      const res = await castVote(storyIdCast, Number(proposalIndex));
      setResult(JSON.stringify(res, null, 2));
    } catch (e: any) {
      setResult(e.message || String(e));
    }
    setLoadingCast(false);
  };

  // 完成故事
  const handleCompleteStory = async () => {
    setResult('');
    setLoadingComplete(true);
    try {
      const res = await completeStory(storyIdComplete);
      setResult(JSON.stringify(res, null, 2));
    } catch (e: any) {
      setResult(e.message || String(e));
    }
    setLoadingComplete(false);
  };

  // 查询故事
  const handleGetStory = async () => {
    setResult('');
    setLoadingQuery(true);
    try {
      const res = await getStory(storyIdQuery);
      setResult(JSON.stringify(res, null, 2));
    } catch (e: any) {
      setResult(e.message || String(e));
    }
    setLoadingQuery(false);
  };

  // 查询事件
  const handleGetEvents = async () => {
    setResult('');
    setLoadingEvent(true);
    try {
      const res = await getEvents(eventType);
      setResult(JSON.stringify(res, null, 2));
    } catch (e: any) {
      setResult(e.message || String(e));
    }
    setLoadingEvent(false);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/story" element={<Story />} />
        <Route path="/story/:index" element={<BookDetail />} />
        <Route path="/" element={
          <div className="p-4 max-w-xl mx-auto">
            <ConnectButton />
            <h1 className="text-2xl font-bold mb-4">Sui Story 区块链交互测试</h1>
            {/* 创建故事 */}
            <div className="mb-4">
              <h2 className="font-semibold mb-2">创建故事（自动上传 Walrus）</h2>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="标题" className="border p-1 mr-2" />
              <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="内容正文" className="border p-1 mr-2 w-full h-24" />
              <button onClick={handleCreateStory} className="bg-blue-500 text-white px-4 py-1 rounded" disabled={loadingCreate}>
                {loadingCreate ? '创建中...' : '创建'}
              </button>
            </div>
            {/* 添加段落 */}
            <div className="mb-4">
              <h2 className="font-semibold mb-2">添加段落</h2>
              <input value={storyIdPara} onChange={e => setStoryIdPara(e.target.value)} placeholder="故事ID" className="border p-1 mr-2" />
              <input value={paraContentHash} onChange={e => setParaContentHash(e.target.value)} placeholder="内容哈希" className="border p-1 mr-2" />
              <input value={paraWalrusId} onChange={e => setParaWalrusId(e.target.value)} placeholder="Walrus ID" className="border p-1 mr-2" />
              <button onClick={handleAddParagraph} className="bg-indigo-500 text-white px-4 py-1 rounded" disabled={loadingPara}>
                {loadingPara ? '添加中...' : '添加'}
              </button>
            </div>
            {/* 开始投票 */}
            <div className="mb-4">
              <h2 className="font-semibold mb-2">开始投票</h2>
              <input value={storyIdVote} onChange={e => setStoryIdVote(e.target.value)} placeholder="故事ID" className="border p-1 mr-2" />
              <input value={proposalsHash} onChange={e => setProposalsHash(e.target.value)} placeholder="提案哈希（逗号分隔）" className="border p-1 mr-2 w-48" />
              <input value={proposalsWalrusId} onChange={e => setProposalsWalrusId(e.target.value)} placeholder="提案WalrusID（逗号分隔）" className="border p-1 mr-2 w-48" />
              <input value={votingDuration} onChange={e => setVotingDuration(e.target.value)} placeholder="投票时长（秒）" className="border p-1 mr-2 w-32" />
              <button onClick={handleStartVoting} className="bg-purple-500 text-white px-4 py-1 rounded" disabled={loadingStartVote}>
                {loadingStartVote ? '发起中...' : '发起'}
              </button>
            </div>
            {/* 投票 */}
            <div className="mb-4">
              <h2 className="font-semibold mb-2">投票</h2>
              <input value={storyIdCast} onChange={e => setStoryIdCast(e.target.value)} placeholder="故事ID" className="border p-1 mr-2" />
              <input value={proposalIndex} onChange={e => setProposalIndex(e.target.value)} placeholder="提案序号" className="border p-1 mr-2 w-24" />
              <button onClick={handleCastVote} className="bg-pink-500 text-white px-4 py-1 rounded" disabled={loadingCast}>
                {loadingCast ? '投票中...' : '投票'}
              </button>
            </div>
            {/* 完成故事 */}
            <div className="mb-4">
              <h2 className="font-semibold mb-2">完成故事</h2>
              <input value={storyIdComplete} onChange={e => setStoryIdComplete(e.target.value)} placeholder="故事ID" className="border p-1 mr-2" />
              <button onClick={handleCompleteStory} className="bg-green-600 text-white px-4 py-1 rounded" disabled={loadingComplete}>
                {loadingComplete ? '完成中...' : '完成'}
              </button>
            </div>
            {/* 查询故事 */}
            <div className="mb-4">
              <h2 className="font-semibold mb-2">查询故事</h2>
              <input value={storyIdQuery} onChange={e => setStoryIdQuery(e.target.value)} placeholder="故事ID" className="border p-1 mr-2" />
              <button onClick={handleGetStory} className="bg-green-500 text-white px-4 py-1 rounded" disabled={loadingQuery}>
                {loadingQuery ? '查询中...' : '查询'}
              </button>
            </div>
            {/* 查询事件 */}
            <div className="mb-4">
              <h2 className="font-semibold mb-2">查询事件</h2>
              <input value={eventType} onChange={e => setEventType(e.target.value)} placeholder="事件类型（如 narr_flow::token::TokensRewarded）" className="border p-1 mr-2 w-80" />
              <button onClick={handleGetEvents} className="bg-purple-500 text-white px-4 py-1 rounded" disabled={loadingEvent}>
                {loadingEvent ? '查询中...' : '查询'}
              </button>
            </div>
            {/* 结果展示 */}
            <div className="mt-6">
              <h2 className="font-semibold mb-2">结果</h2>
              <pre className="bg-gray-100 p-2 rounded text-xs max-h-96 overflow-auto">{result}</pre>
            </div>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
