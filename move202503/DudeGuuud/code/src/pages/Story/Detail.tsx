import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSuiStory } from '../../hooks/useSuiStoryWithWalrus';
import { useLang } from '../../contexts/lang/LangContext';
import Navbar from '../../components/layout/Navbar';

const BookDetail: React.FC = () => {
  const { getBookByIndex, getAllParagraphContents } = useSuiStory();
  const { t } = useLang();
  const { index } = useParams<{ index: string }>();
  const [book, setBook] = useState<any>(null);
  const [paragraphs, setParagraphs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchBook() {
      setLoading(true);
      if (!index) return;
      const b = await getBookByIndex(Number(index));
      setBook(b);
      if (b) {
        const contents = await getAllParagraphContents(b);
        setParagraphs(contents);
      } else {
        setParagraphs([]);
      }
      setLoading(false);
    }
    fetchBook();
  }, [index]);

  if (loading) return <div className="text-center py-8">{t('加载中...') || '加载中...'}</div>;
  if (!book) return <div className="text-center py-8">{t('未找到该书') || '未找到该书'}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800">
      <Navbar />
      <div className="container mx-auto px-4 py-16">
        <button
          className="mb-4 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
          onClick={() => navigate(-1)}
        >
          ← {t('返回') || '返回'}
        </button>
        <h2 className="text-3xl font-bold mb-2">{book.title}</h2>
        <div className="mb-4 text-gray-600 dark:text-gray-300">
          {t('归档状态') || '归档状态'}: {book.status === 1 ? t('已归档') : t('进行中')}
        </div>
        <div className="mb-8 text-gray-600 dark:text-gray-300">
          {t('段落数') || '段落数'}: {book.paragraphs?.length || 0}
        </div>
        <div className="space-y-6">
          {paragraphs.map((para, idx) => (
            <div key={idx} className="p-4 bg-white dark:bg-gray-900 rounded shadow">
              <div className="font-bold mb-2">{t('第{number}段', { number: idx + 1 }) || `第${idx + 1}段`}</div>
              <div className="whitespace-pre-line">{para}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BookDetail;
