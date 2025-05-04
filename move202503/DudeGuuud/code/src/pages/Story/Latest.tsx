import React, { useEffect, useState } from 'react';
import Navbar from '../../components/layout/Navbar';
import { useSuiStory } from '../../hooks/useSuiStoryWithWalrus';
import { useLang } from '../../contexts/lang/LangContext';
import { shortenAddress } from '../../utils/langUtils';
import { motion, AnimatePresence } from 'framer-motion';

const LatestStory: React.FC = () => {
  const { getAllBooks, getAllParagraphContents } = useSuiStory();
  const { t } = useLang();
  const [archivedBooks, setArchivedBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [selectedParagraphs, setSelectedParagraphs] = useState<string[]>([]);

  useEffect(() => {
    async function fetchLatest() {
      setLoading(true);
      const books = await getAllBooks();
      const archived = books.filter((b: any) => b.status === 1);
      setArchivedBooks(archived);
      setLoading(false);
    }
    fetchLatest();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800"><span className="text-lg text-gray-500">{t('加载中...') || '加载中...'}</span></div>;
  }

  // 封面列表
  if (!selectedBook) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800">
        <Navbar />
        <div className="container mx-auto px-4 py-16 flex flex-col items-center">
          {archivedBooks.length === 0 && (
            <div className="text-gray-400 text-center text-xl mt-24">{t('暂无归档书')}</div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
            {archivedBooks.map((book, idx) => (
              <div
                key={book.id || idx}
                className="flex flex-row rounded-2xl shadow-2xl hover:scale-[1.02] hover:shadow-[0_8px_32px_rgba(0,0,0,0.18)] transition-transform duration-300 cursor-pointer bg-white dark:bg-gray-900"
                onClick={async () => {
                  setSelectedBook(book);
                  setLoading(true);
                  const paras = await getAllParagraphContents(book);
                  setSelectedParagraphs(paras);
                  setLoading(false);
                }}
                style={{ minHeight: 220 }}
              >
                {/* 封面区 */}
                <div className="w-1/3 min-w-[120px] bg-gradient-to-br from-orange-700 via-yellow-700 to-yellow-400 dark:from-gray-800 dark:via-gray-700 dark:to-gray-500 rounded-l-2xl flex flex-col justify-center items-center shadow-lg relative">
                  <div className="absolute left-0 top-0 h-full w-2 bg-gradient-to-b from-yellow-300/60 to-orange-900/80 rounded-l-2xl" />
                  <div className="text-xl font-bold text-white text-center break-words mb-2 drop-shadow-lg" style={{ textShadow: '0 2px 8px #0006' }}>{book.title}</div>
                  <div className="text-yellow-100 text-sm mb-1">{t('作者')}：{shortenAddress(book.author)}</div>
                  <div className="text-yellow-100 text-sm mb-1">{t('段落数')}：{book.paragraphs?.length || 0}</div>
                  <div className="text-yellow-100 text-sm">{t('总投票')}：{book.total_votes ?? 0}</div>
                </div>
                {/* 内容区 */}
                <div className="flex-1 rounded-r-2xl flex flex-col justify-center items-center p-6">
                  <div className="text-lg font-semibold text-primary-700 dark:text-primary-200 mb-2">{t('click_to_read')}</div>
                  <div className="text-gray-400 text-sm">{t('已归档的书')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  // 书详情页
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800">
      <Navbar />
      <div className="container mx-auto px-4 py-16 flex flex-col items-center">
        <div className="w-full max-w-2xl mt-8 relative">
          <div className="flex justify-between mb-4">
            <button onClick={() => setSelectedBook(null)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 text-sm">← {t('返回') || '返回'}</button>
            <div className="text-lg font-bold text-primary-700 dark:text-primary-200">{selectedBook.title}</div>
            <div></div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8 flex flex-col gap-6">
            {selectedParagraphs.length === 0 && <div className="text-gray-400 text-center">{t('暂无段落')}</div>}
            {selectedParagraphs.map((para, idx) => (
              <div key={idx}>
                <div className="font-bold mb-2 text-primary-700 dark:text-primary-200">{t('第{number}段', { number: idx + 1 })}</div>
                <div className="whitespace-pre-line text-gray-800 dark:text-gray-100">{para}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LatestStory; 