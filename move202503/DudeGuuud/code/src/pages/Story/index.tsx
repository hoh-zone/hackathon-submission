import React, { useEffect, useState } from 'react';
import { FadeIn } from '../../components/animations';
import Navbar from '../../components/layout/Navbar';
import { useSuiStory } from '../../hooks/useSuiStoryWithWalrus';
import { useLang } from '../../contexts/lang/LangContext';
import { useNavigate } from 'react-router-dom';
import { shortenAddress } from '../../utils/langUtils';

// ArchivedBooks 组件：展示所有已归档的书（链上集成预留接口）
const ArchivedBooks: React.FC = () => {
  // TODO: 替换为链上查询逻辑
  // 示例数据
  const [books] = React.useState([
    { title: '第一本书', author: 'Alice', paragraph_count: 10, total_votes: 15, index: 1 },
    { title: '第二本书', author: 'Bob', paragraph_count: 9, total_votes: 12, index: 2 },
  ]);
  if (!books.length) return <div>暂无归档书</div>;
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">已归档的书</h2>
      {books.map((book, idx) => (
        <div key={idx} className="p-4 border rounded mb-2">
          <h3 className="font-bold">{book.title}（第{book.index}本书）</h3>
          <p>作者: {book.author}</p>
          <p>段落数: {book.paragraph_count}</p>
          <p>总投票: {book.total_votes}</p>
        </div>
      ))}
    </div>
  );
};

const BrowseStories: React.FC = () => {
  const { getAllBooks } = useSuiStory();
  const { t } = useLang();
  const [books, setBooks] = useState<any[]>([]);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      const allBooks = await getAllBooks();
      setBooks(allBooks);
      setLoading(false);
    }
    fetch();
  }, []);

  if (loading) return <div>{t('加载中...') || '加载中...'}</div>;
  if (!books.length) return <div>{t('暂无书本') || '暂无书本'}</div>;

  const archivedBooks = books.filter((b: any) => b.status === 1);
  const activeBooks = books.filter((b: any) => b.status === 0);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">{t('进行中的书') || '进行中的书'}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {activeBooks.length ? activeBooks.map((book, idx) => (
          <div
            key={book.index}
            className="p-4 border rounded shadow hover:shadow-lg cursor-pointer bg-white dark:bg-gray-800 transition"
            onClick={() => navigate(`/story/${book.index}`)}
          >
            <h3 className="font-bold text-lg">{book.title}（{t('进行中') || '进行中'}）</h3>
            <p>{t('段落数') || '段落数'}: {book.paragraphs?.length || 0}</p>
            <p>{t('总投票') || '总投票'}: {book.total_votes ?? 0}</p>
          </div>
        )) : <div className="col-span-2">{t('暂无进行中的书') || '暂无进行中的书'}</div>}
      </div>
      <h2 className="text-2xl font-bold mb-4">{t('已归档的书') || '已归档的书'}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {archivedBooks.length ? archivedBooks.map((book, idx) => (
          <div
            key={book.index}
            className="p-4 border rounded shadow hover:shadow-lg cursor-pointer bg-white dark:bg-gray-800 transition"
            onClick={() => navigate(`/story/${book.index}`)}
          >
            <h3 className="font-bold text-lg">{book.title}（{t('已归档') || '已归档'}）</h3>
            <p>{t('段落数') || '段落数'}: {book.paragraphs?.length || 0}</p>
            <p>{t('总投票') || '总投票'}: {book.total_votes ?? 0}</p>
          </div>
        )) : <div className="col-span-2">{t('暂无归档书') || '暂无归档书'}</div>}
      </div>
    </div>
  );
};

const Story: React.FC = () => {
  const { getAllBooks, getAllParagraphContents } = useSuiStory();
  const { t } = useLang();
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState<any | null>(null);
  const [paragraphContents, setParagraphContents] = useState<string[]>([]);
  const [paragraphLoading, setParagraphLoading] = useState(false);

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      const allBooks = await getAllBooks();
      setBooks(allBooks);
      setLoading(false);
    }
    fetch();
  }, []);

  // 选中某本书，拉取段落内容
  const handleSelectBook = async (book: any) => {
    setSelectedBook(book);
    setParagraphLoading(true);
    const contents = await getAllParagraphContents(book);
    setParagraphContents(contents);
    setParagraphLoading(false);
  };

  // 关闭全文弹窗
  const handleCloseDetail = () => {
    setSelectedBook(null);
    setParagraphContents([]);
  };

  if (loading) return <div className="text-center text-gray-500 dark:text-gray-300 py-16">{t('加载中...')}</div>;
  if (!books.length) return <div className="text-center text-gray-500 dark:text-gray-300 py-16">{t('暂无书本')}</div>;

  const archivedBooks = books.filter((b: any) => b.status === 1);
  const activeBooks = books.filter((b: any) => b.status === 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800">
      <Navbar />
      <div className="container mx-auto px-4 py-16">
        <FadeIn>
          <h1 className="text-4xl font-bold text-primary-900 dark:text-primary-100 mb-6 text-center">
            {t('已归档的书')}
          </h1>
        </FadeIn>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {archivedBooks.length ? archivedBooks.map((book, idx) => (
            <div
              key={book.index}
              className="p-6 bg-white dark:bg-gray-900 rounded-xl shadow hover:shadow-lg cursor-pointer border border-primary-100 transition flex flex-col gap-2"
              onClick={() => handleSelectBook(book)}
            >
              <div className="font-bold text-lg text-primary-700 dark:text-primary-200 mb-1">{book.title}（{t('第{index}本', { index: book.index })}）</div>
              <div className="text-sm text-gray-500">{t('作者')}：{shortenAddress(book.author)}</div>
              <div className="text-sm text-gray-500">{t('段落数')}：{book.paragraphs?.length || 0}</div>
              <div className="text-sm text-gray-500">{t('总投票')}：{book.total_votes ?? 0}</div>
            </div>
          )) : <div className="col-span-2 text-gray-400 text-center">{t('暂无归档书')}</div>}
        </div>
        {/* 归档书全文弹窗 */}
        {selectedBook && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg max-w-2xl w-full p-8 relative">
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-primary-500 text-2xl"
                onClick={handleCloseDetail}
                title={t('关闭')}
              >
                ×
              </button>
              <h2 className="text-2xl font-bold text-primary-700 dark:text-primary-100 mb-4 text-center">{selectedBook.title}（{t('第{index}本', { index: selectedBook.index })}）</h2>
              <div className="mb-2 text-primary-700 dark:text-primary-200 text-center">{t('作者')}：{shortenAddress(selectedBook.author)}</div>
              <div className="mb-6 text-center text-gray-500">{t('段落数')}：{selectedBook.paragraphs?.length || 0}</div>
              <div className="space-y-6">
                {paragraphLoading ? (
                  <div className="text-center text-gray-400">{t('加载中...')}</div>
                ) : (
                  paragraphContents.map((para, idx) => (
                    <div key={idx} className="p-4 bg-primary-50 dark:bg-gray-800 rounded shadow">
                      <div className="font-bold mb-2 text-primary-700 dark:text-primary-200">{idx === 0 ? t('标题') : t('第{number}段', { number: idx })}</div>
                      <div className="whitespace-pre-line text-gray-800 dark:text-gray-100">{para}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Story;