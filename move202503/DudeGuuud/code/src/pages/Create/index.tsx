import React, { useEffect, useState } from 'react';
import { useSuiStory } from '../../hooks/useSuiStoryWithWalrus';
import { FaThumbsUp } from 'react-icons/fa';
import Navbar from '../../components/layout/Navbar';
import { useLang } from '../../contexts/lang/LangContext';
import { shortenAddress } from '../../utils/langUtils';
import { useWallet } from '@suiet/wallet-kit';
import { supabase } from '../../lib/supabaseClient';

const MAX_BYTES = 2000;

const CreatePage: React.FC = () => {
  const {
    getCurrentBook,
    addParagraph,
    voteParagraph,
    archiveBook,
    startNewBook,
    getAllParagraphContents,
    addParagraphAndArchive,
  } = useSuiStory();
  const { lang, t } = useLang();
  const { account } = useWallet();
  const VOTE_THRESHOLD = 2; // 获胜阈值，1票自动上链

  const [book, setBook] = useState<any>(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [inputBytes, setInputBytes] = useState(0);
  const [paragraphContents, setParagraphContents] = useState<string[]>([]);
  const [paragraphLoading, setParagraphLoading] = useState(false);
  const [showStartNewBook, setShowStartNewBook] = useState(false);

  // 提案和投票状态，全部从 Supabase 获取
  const [proposals, setProposals] = useState<any[]>([]);
  const [loadingProposals, setLoadingProposals] = useState(false);
  const [votedProposalId, setVotedProposalId] = useState<string | null>(null); // 当前钱包已投的提案id

  // 防止自动写入链上段落死循环
  const [writing, setWriting] = useState(false);

  // 当前投票类型：没有书时为'title'，有进行中的书时为'paragraph'
  const [voteType, setVoteType] = useState<'title' | 'paragraph'>('paragraph');

  const ADMIN_ADDRESS = '0x1234567890abcdef...'; // TODO: 替换为你的管理员钱包地址

  // 刷新当前书本信息
  const refresh = async () => {
    const b = await getCurrentBook();
    console.log('链上book:', b);
    console.log('book.paragraphs:', b?.paragraphs, Array.isArray(b?.paragraphs) ? b.paragraphs.length : 'not array');
    setBook(b);
    if (!b || b.status === 1) {
      setVoteType('title');
    } else {
      setVoteType('paragraph');
    }
    if (b && Array.isArray(b.paragraphs) && b.paragraphs.length > 0) {
      setParagraphLoading(true);
      const contents = await getAllParagraphContents(b);
      console.log('链上paragraphContents:', contents);
      setParagraphContents(contents);
      setParagraphLoading(false);
    } else {
      setParagraphContents([]);
    }
    // 归档后自动检测
    if (b && b.status === 1) {
      setShowStartNewBook(true);
    } else {
      setShowStartNewBook(false);
    }
  };

  useEffect(() => {
    // 页面加载时只刷新，不自动新建书
    refresh();
    // 可加定时刷新或事件监听
  }, []);

  // 实时统计字节数
  useEffect(() => {
    setInputBytes(new TextEncoder().encode(content).length);
  }, [content]);

  // 段落序号判断逻辑修正：
  // index为0时，显示为第1本
  const bookIndex = typeof book?.index === 'number' ? (book.index === 0 ? 1 : book.index) : 1;
  const currentParagraphIndex = Array.isArray(book?.paragraphs) ? book.paragraphs.length : 0;
  console.log('currentParagraphIndex:', currentParagraphIndex);
  // 只有没有书或已归档时才为 true，有进行中的书都为 false
  const isEditingTitle = !book || book.status === 1;
  console.log('isEditingTitle:', isEditingTitle);
  const maxBytes = isEditingTitle ? 100 : 2000;

  // 获取所有提案（按type过滤）
  const fetchProposals = async () => {
    setLoadingProposals(true);
    const { data, error } = await supabase
      .from('proposals')
      .select('*')
      .order('created_at', { ascending: true });
    console.log('fetchProposals all:', data);
    if (!error && data) {
      setProposals(data);
    }
    setLoadingProposals(false);
  };

  // 获取当前钱包已投的提案id
  const fetchVotedProposal = async (address: string) => {
    const { data, error } = await supabase
      .from('votes')
      .select('proposal_id')
      .eq('voter', address.toLowerCase());
    if (!error && data && data.length > 0) {
      setVotedProposalId(data[0].proposal_id);
    } else {
      setVotedProposalId(null);
    }
  };

  // 页面加载和钱包变更时拉取数据
  useEffect(() => {
    fetchProposals();
    if (account?.address) {
      fetchVotedProposal(account.address);
    }
  }, [account?.address, voteType]);

  // 判断当前用户是否已对该提案投票
  const hasVoted = (proposalId: string) => {
    return votedProposalId === proposalId;
  };

  // 判断当前用户是否已对其他提案投票
  const hasVotedOther = (proposalId: string) => {
    return !!votedProposalId && votedProposalId !== proposalId;
  };

  // 轮询链上段落是否已添加
  const waitForParagraphAdded = async (expectedCount: number, timeout = 15000) => {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const latestBook = await getCurrentBook();
      if (latestBook && Array.isArray(latestBook.paragraphs) && latestBook.paragraphs.length >= expectedCount) {
        return true;
      }
      await new Promise(res => setTimeout(res, 1500));
    }
    return false;
  };

  // 监听书名投票池，票数达标后自动新建书
  useEffect(() => {
    if (voteType === 'title') {
      const winner = proposals.filter((p) => p.votes >= VOTE_THRESHOLD)[0];
      if (winner && !loading && !writing) {
        setWriting(true);
        (async () => {
          setLoading(true);
          try {
            await startNewBook(winner.content);
            // 只有链上成功才清空
            await supabase.from('proposals').delete().not('id', 'is', null);
            await supabase.from('votes').delete().not('id', 'is', null);
            await fetchProposals();
            setVotedProposalId(null);
            await refresh();
          } catch (e) {
            alert('链上签名失败，数据未清空');
          } finally {
            setLoading(false);
            setWriting(false);
          }
        })();
      }
    }
  }, [proposals, voteType]);

  // 监听提案得票数，自动采纳
  useEffect(() => {
    const winner = proposals
      .filter((p) => p.votes >= VOTE_THRESHOLD)
      .sort((a, b) => b.votes - a.votes)[0];
    if (winner && !loading && !writing) {
      setWriting(true);
      (async () => {
        setLoading(true);
        try {
          if (voteType === 'title') {
            await startNewBook(winner.content);
            await supabase.from('proposals').delete().not('id', 'is', null);
            await supabase.from('votes').delete().not('id', 'is', null);
            await fetchProposals();
            setVotedProposalId(null);
            await refresh();
          } else {
            const latestBook = await getCurrentBook();
            if (latestBook && Array.isArray(latestBook.paragraphs)) {
              const exists = latestBook.paragraphs.some((p: any) => p.content === winner.content);
              if (!exists) {
                try {
                  if (latestBook.paragraphs.length + 1 >= 10) {
                    await addParagraphAndArchive(winner.content);
                  } else {
                    await addParagraph(winner.content);
                  }
                  const ok = await waitForParagraphAdded(latestBook.paragraphs.length + 1);
                  if (!ok) {
                    alert('链上数据未及时同步，请手动刷新页面。');
                  }
                } catch (e) {
                  alert('链上交易失败，请重试。');
                  setLoading(false);
                  setWriting(false);
                  return;
                }
              }
            }
            // 只有链上成功才清空
            await supabase.from('proposals').delete().not('id', 'is', null);
            await supabase.from('votes').delete().not('id', 'is', null);
            await fetchProposals();
            setVotedProposalId(null);
            await refresh();
          }
        } catch (e) {
          alert('链上交易失败，数据未清空');
        } finally {
          setLoading(false);
          setWriting(false);
        }
      })();
    }
  }, [proposals, voteType]);

  // 提交新提案
  const handleAddProposal = async () => {
    const address = account?.address?.toLowerCase() || '';
    if (!content.trim() || !address) return;
    const { error } = await supabase.from('proposals').insert({
      content,
      author: address,
      votes: 0,
      type: 'title', // 强制写死，保证书名投票阶段能查到
      created_at: new Date().toISOString(),
    });
    if (!error) {
      setContent('');
      fetchProposals();
    }
  };

  // 渲染时log，辅助排查段落数同步问题
  console.log('渲染时的 book:', book);
  console.log('渲染时的 book.paragraphs:', book?.paragraphs);
  const editingText = !book || book.status === 1
    ? t('editing_title')
    : t('editing_paragraph', { number: (Array.isArray(book?.paragraphs) ? book.paragraphs.length : 0) + 1 });

  // 投票
  const handleVote = async (proposalId: string) => {
    const address = account?.address?.toLowerCase() || '';
    if (!address) return;
    const proposal = proposals.find(p => p.id === proposalId);
    if (!proposal /*|| proposal.author === address*/) return; // 暂时允许投自己
    if (votedProposalId && votedProposalId !== proposalId) return;
    if (hasVoted(proposalId)) return;
    const newVotes = proposal.votes + 1;

    if (newVotes < VOTE_THRESHOLD) {
      // 票数未满阈值，正常写 supabase
      await supabase.from('votes').insert({
        proposal_id: proposalId,
        voter: address,
        created_at: new Date().toISOString(),
      });
      await supabase.from('proposals').update({ votes: newVotes }).eq('id', proposalId);
      fetchProposals();
      setVotedProposalId(proposalId);
    } else if (voteType === 'paragraph') {
      setLoading(true);
      try {
        const latestBook = await getCurrentBook();
        if (latestBook && Array.isArray(latestBook.paragraphs)) {
          const exists = latestBook.paragraphs.some((p: any) => p.content === proposal.content);
          if (!exists) {
            try {
              if (latestBook.paragraphs.length + 1 >= 10) {
                await addParagraphAndArchive(proposal.content);
              } else {
                await addParagraph(proposal.content);
              }
              const ok = await waitForParagraphAdded(latestBook.paragraphs.length + 1);
              if (!ok) {
                alert('链上数据未及时同步，请手动刷新页面。');
              }
            } catch (e) {
              alert('链上交易失败，请重试。');
              setLoading(false);
              setWriting(false);
              return;
            }
          }
        }
        // 只有链上成功才清空
        await supabase.from('proposals').delete().not('id', 'is', null);
        await supabase.from('votes').delete().not('id', 'is', null);
        await fetchProposals();
        setVotedProposalId(null);
        await refresh();
      } catch (e) {
        alert('链上交易失败，数据未清空');
      } finally {
        setLoading(false);
      }
    } else if (voteType === 'title') {
      setLoading(true);
      try {
        await startNewBook(proposal.content);
        // 只有链上成功才清空
        await supabase.from('proposals').delete().not('id', 'is', null);
        await supabase.from('votes').delete().not('id', 'is', null);
        await fetchProposals();
        setVotedProposalId(null);
        await refresh();
      } catch (e) {
        alert('链上签名失败，数据未清空');
      } finally {
        setLoading(false);
      }
    }
  };

  // 归档
  const handleArchive = async () => {
    setLoading(true);
    try {
      await archiveBook();
      await refresh();
      // 归档后自动开启新书
      await startNewBook(t('新书标题'));
      await refresh();
    } finally {
      setLoading(false);
    }
  };

  // 开启新书
  const handleStartNewBook = async () => {
    setLoading(true);
    try {
      await startNewBook(t('新书标题'));
      await refresh();
    } finally {
      setLoading(false);
    }
  };

  // 页面渲染逻辑重构
  if (loading) {
    return <div>{t('loading')}</div>;
  }

  if (voteType === 'title') {
    // 渲染书名提案与投票UI
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800">
      <Navbar />
      <div className="container mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold text-primary-900 dark:text-primary-100 mb-2">
            {t('create_book_title')}
        </h2>
          <h3 className="text-xl font-semibold text-primary-800 dark:text-primary-100 mb-4">{t('proposal_pool')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {proposals.length === 0 ? (
              <div className="text-gray-400 text-center col-span-2">{t('no_proposal')}</div>
            ) : (
              proposals.map((p) => (
                <div key={p.id} className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-6 flex flex-col gap-2 border border-primary-100 hover:shadow-lg transition">
                  <div className="font-semibold text-lg text-primary-700 dark:text-primary-200 mb-2">{p.content}</div>
                  <div className="text-sm text-gray-500">{t('author')}：{shortenAddress(p.author)}</div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-primary-600 dark:text-primary-300 font-bold">{t('vote_count')}：{p.votes}</span>
                    <button
                      className="px-3 py-1 rounded bg-primary-500 text-white disabled:bg-gray-300 disabled:text-gray-400 dark:disabled:bg-gray-700 dark:disabled:text-gray-500 shadow hover:bg-primary-600 transition"
                      onClick={() => handleVote(p.id)}
                      disabled={!account?.address || hasVoted(p.id) || hasVotedOther(p.id)}
                    >
                      {p.author === (account?.address?.toLowerCase() || '') ? t('cannot_vote_self') : hasVoted(p.id) ? t('voted') : hasVotedOther(p.id) ? t('voted_other') : t('vote')}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="mt-8 flex flex-col md:flex-row gap-4 items-end">
            <div className="mb-2 text-primary-700 dark:text-primary-200 font-semibold">
              {t('editing_title')}
            </div>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={4}
              className={`w-full rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-primary-400 dark:bg-gray-800 dark:text-white dark:border-gray-700 ${inputBytes > 100 ? 'border-red-500 focus:ring-red-500' : 'border-primary-200'}`}
              placeholder={t('title_placeholder')}
            />
            <button
              onClick={handleAddProposal}
              disabled={!content.trim() || !account?.address || inputBytes > 100}
              className="h-12 px-8 rounded-lg bg-primary-500 text-white font-bold shadow hover:bg-primary-600 transition disabled:bg-gray-300 disabled:text-gray-400 dark:disabled:bg-gray-700 dark:disabled:text-gray-500 mt-2 md:mt-0"
            >
              {t('submit_proposal')}
            </button>
          </div>
          <div className={`mt-2 text-sm ${inputBytes > 100 ? 'text-red-500' : 'text-gray-500'}`}>{t('byte_count', { current: inputBytes, max: 100 })}</div>
        </div>
      </div>
    );
  }

  // 正文投票模式
  if (voteType === 'paragraph' && book && Array.isArray(book.paragraphs)) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800">
        <Navbar />
        <div className="container mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold text-primary-900 dark:text-primary-100 mb-2">
            {book.title ? `${book.title}（${t('book_index', { index: bookIndex })}）` : t('create_book_title')}
          </h2>
          <div className="mb-4 text-primary-700 dark:text-primary-200">
          {t('create_archive_threshold')}：{book.archive_votes_threshold}
        </div>
          <h3 className="text-xl font-semibold text-primary-800 dark:text-primary-100 mb-4">{t('proposal_pool')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {proposals.length === 0 ? (
              <div className="text-gray-400 text-center col-span-2">{t('no_proposal')}</div>
            ) : (
              proposals.map((p) => (
                <div key={p.id} className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-6 flex flex-col gap-2 border border-primary-100 hover:shadow-lg transition">
                  <div className="font-semibold text-lg text-primary-700 dark:text-primary-200 mb-2">{p.content}</div>
                  <div className="text-sm text-gray-500">{t('author')}：{shortenAddress(p.author)}</div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-primary-600 dark:text-primary-300 font-bold">{t('vote_count')}：{p.votes}</span>
              <button
                      className="px-3 py-1 rounded bg-primary-500 text-white disabled:bg-gray-300 disabled:text-gray-400 dark:disabled:bg-gray-700 dark:disabled:text-gray-500 shadow hover:bg-primary-600 transition"
                      onClick={() => handleVote(p.id)}
                      disabled={!account?.address || hasVoted(p.id) || hasVotedOther(p.id)}
                    >
                      {p.author === (account?.address?.toLowerCase() || '') ? t('cannot_vote_self') : hasVoted(p.id) ? t('voted') : hasVotedOther(p.id) ? t('voted_other') : t('vote')}
              </button>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="mt-8 flex flex-col md:flex-row gap-4 items-end">
            <div className="mb-2 text-primary-700 dark:text-primary-200 font-semibold">
              {editingText}
            </div>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={4}
              className={`w-full rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-primary-400 dark:bg-gray-800 dark:text-white dark:border-gray-700 ${inputBytes > maxBytes ? 'border-red-500 focus:ring-red-500' : 'border-primary-200'}`}
              placeholder={t('proposal_placeholder')}
            />
            <button
              onClick={handleAddProposal}
              disabled={!content.trim() || !account?.address || inputBytes > maxBytes}
              className="h-12 px-8 rounded-lg bg-primary-500 text-white font-bold shadow hover:bg-primary-600 transition disabled:bg-gray-300 disabled:text-gray-400 dark:disabled:bg-gray-700 dark:disabled:text-gray-500 mt-2 md:mt-0"
            >
              {t('submit_proposal')}
            </button>
          </div>
          <div className={`mt-2 text-sm ${inputBytes > maxBytes ? 'text-red-500' : 'text-gray-500'}`}>{t('byte_count', { current: inputBytes, max: maxBytes })}</div>
          {/* 归档后提示开启新书 */}
          {showStartNewBook && (
          <div style={{ marginTop: 24 }}>
              <button onClick={handleStartNewBook} disabled={loading} className="px-6 py-2 rounded-lg bg-primary-400 text-white font-bold shadow hover:bg-primary-600 transition">
                {t('start_new_book')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
  }

  // 兜底
  return <div>{t('loading')}</div>;
};

export default CreatePage;