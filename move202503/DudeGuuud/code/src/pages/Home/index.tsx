import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FadeIn, SlideUp } from '../../components/animations';
import Navbar from '../../components/layout/Navbar';
import { useLang } from '../../contexts/lang/LangContext';
import { replaceParams } from '../../utils/langUtils';
import { isMobileDevice } from '../../utils/deviceUtils';
import { useSuiStory } from '../../hooks/useSuiStoryWithWalrus';
import { shortenAddress } from '../../utils/langUtils';
import { decompressFromBase64 } from 'lz-string';

const MAX_BYTES = 2000;

// VotingBook 组件：展示正在投票的书（链上集成预留接口）
const VotingBook: React.FC = () => {
  const { t } = useLang();
  // TODO: 替换为链上查询逻辑
  // 示例数据
  const [book, setBook] = useState<any>({
    title: t('demo_book_title'),
    author: t('demo_book_author'),
    paragraph_count: 5,
    total_votes: 8,
    status: 0,
  });
  // 可根据链上 currentBookId 判断是否有正在投票的书
  if (!book) return null;
  return (
    <div className="mb-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-2">{t('voting_book_title', { title: book.title })}</h2>
      <p>{t('voting_book_author', { author: book.author })}</p>
      <p>{t('voting_book_paragraph_count', { count: book.paragraph_count })}</p>
      <p>{t('voting_book_total_votes', { votes: book.total_votes })}</p>
      <p>{t('voting_book_status', { status: book.status === 0 ? t('create_status_ongoing') : t('create_status_archived') })}</p>
    </div>
  );
};

const Home: React.FC = () => {
  const { t } = useLang();
  const [pageIndex, setPageIndex] = useState(0);
  const [flipping, setFlipping] = useState(false);
  const [direction, setDirection] = useState(0); // -1: 向左翻, 1: 向右翻, 0: 不翻
  const [isMobile, setIsMobile] = useState(false);
  const {
    startNewBook,
    addParagraph,
    getAllBooks,
    getAllParagraphs,
    calcContentHash,
  } = useSuiStory();

  const [books, setBooks] = useState<any[]>([]);
  const [currentBook, setCurrentBook] = useState<any>(null);
  const [paragraphs, setParagraphs] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [inputBytes, setInputBytes] = useState(0);
  const [loading, setLoading] = useState(false);

  // 分页参数
  const paragraphsPerPage = 2;
  const maxParagraphs = 10;
  const totalPages = Math.ceil(paragraphs.length / paragraphsPerPage) || 1;

  // 检测设备类型
  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(isMobileDevice());
    };
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => {
      window.removeEventListener('resize', checkDevice);
    };
  }, []);

  // 获取所有书，找到进行中的书
  useEffect(() => {
    async function fetchBooks() {
      const allBooks = await getAllBooks();
      setBooks(allBooks);
      const ongoing = allBooks.find((b: any) => b.status === 0);
      setCurrentBook(ongoing || null);
      if (ongoing) {
        const paras = await getAllParagraphs(ongoing);
        setParagraphs(paras);
      } else {
        setParagraphs([]);
      }
    }
    fetchBooks();
  }, []);

  // 监听input变化，统计字节数
  useEffect(() => {
    setInputBytes(new TextEncoder().encode(input).length);
  }, [input]);

  // 分页逻辑
  const getParagraphsForPage = (pageIndex: number) => {
    const startIdx = pageIndex * paragraphsPerPage;
    const endIdx = Math.min(startIdx + paragraphsPerPage, paragraphs.length);
    return paragraphs.slice(startIdx, endIdx);
  };
  const isLastPage = (pageIndex: number) => {
    return pageIndex === totalPages - 1;
  };

  const goToNextPage = () => {
    if (pageIndex < totalPages - 1 && !flipping) {
      setDirection(1);
      setFlipping(true);
      setTimeout(() => {
        setPageIndex(pageIndex + 1);
        setTimeout(() => {
          setFlipping(false);
          setDirection(0);
        }, 50);
      }, 250);
    }
  };
  const goToPrevPage = () => {
    if (pageIndex > 0 && !flipping) {
      setDirection(-1);
      setFlipping(true);
      setTimeout(() => {
        setPageIndex(pageIndex - 1);
        setTimeout(() => {
          setFlipping(false);
          setDirection(0);
        }, 50);
      }, 250);
    }
  };

  // 输入框onChange处理，禁止超出MAX_BYTES
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const bytes = new TextEncoder().encode(value).length;
    if (bytes <= MAX_BYTES) {
      setInput(value);
    } else {
      // 超出字节数时不更新input
    }
  };

  // 判断当前是提交书名还是段落
  const isEditingTitle = !currentBook || currentBook.status === 1;

  // 提交新书 or 段落
  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (!currentBook) {
        await startNewBook(input);
      } else {
        await addParagraph(input);
      }
      setInput('');
      // 刷新
      const allBooks = await getAllBooks();
      setBooks(allBooks);
      const ongoing = allBooks.find((b: any) => b.status === 0);
      setCurrentBook(ongoing || null);
      if (ongoing) {
        const paras = await getAllParagraphs(ongoing);
        setParagraphs(paras);
      } else {
        setParagraphs([]);
      }
    } catch (e) {
      alert('提交失败: ' + (e as any).message);
    }
    setLoading(false);
  };

  // 页面变体 - 修正翻页方向
  const pageVariants = {
    enter: (direction: number) => ({
      rotateY: direction > 0 ? -90 : 90,
      opacity: 0,
      zIndex: 10,
      boxShadow: "0 0 0 rgba(0, 0, 0, 0)"
    }),
    center: {
      rotateY: 0,
      opacity: 1,
      zIndex: 20,
      boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)"
    },
    exit: (direction: number) => ({
      rotateY: direction < 0 ? -90 : 90,
      opacity: 0,
      zIndex: 10,
      boxShadow: "0 0 0 rgba(0, 0, 0, 0)"
    })
  };
  const pageTransition = {
    type: "tween",
    duration: 0.5,
    ease: "easeInOut"
  };

  // 当前页段落
  const currentPageParagraphs = getParagraphsForPage(pageIndex);
  const showSubmissionForm = isLastPage(pageIndex) && paragraphs.length < maxParagraphs;

  // 书本信息（链上数据）
  const votingBook = currentBook || {
    title: t('暂无书本'),
    author: '',
    paragraph_count: 0,
    total_votes: 0,
    status: 0,
    maxParagraphs,
    collaborators: 0,
  };

  // 由段落去重 author 得到作者数
  const authorSet = new Set((paragraphs || []).map((p: any) => p.author));
  const collaborators = authorSet.size;
  // 总投票数
  const totalVotes = (paragraphs || []).reduce((sum: number, p: any) => sum + (p.votes || 0), 0);
  // 作者地址缩略
  const authorShort = votingBook.author ? shortenAddress(votingBook.author) : '';

  // 在Home组件内添加调试输出
  useEffect(() => {
    console.log('paragraphs:', paragraphs, 'totalPages:', totalPages, 'maxParagraphs:', maxParagraphs);
  }, [paragraphs, totalPages, maxParagraphs]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800">
      <Navbar />
      <div className="container mx-auto px-4 py-6">
        <FadeIn>
          <h1 className="text-4xl font-bold text-primary-900 dark:text-primary-100 mb-2 text-center">
            {t('app_name')}
          </h1>
          <p className={`${isMobile ? 'text-lg mb-4' : 'text-xl mb-10'} text-gray-700 dark:text-gray-300 text-center`}>
            {t('app_description')}
          </p>
        </FadeIn>
        {/* 书本组件（模板样式） */}
        <div className="relative max-w-4xl mx-auto mb-8">
          <div className={`w-full rounded-lg shadow-2xl overflow-hidden ${isMobile ? 'flex flex-col' : 'flex aspect-[2/1.2]'}`}>
            {/* 书本封面 - 左侧或顶部（移动设备） */}
            <div className={`
              ${isMobile ? 'w-full py-4' : 'w-1/2 h-full'} 
              bg-gradient-to-r from-amber-900 to-amber-700 dark:from-gray-700 dark:to-gray-600 
              p-4 flex flex-col justify-between
            `}>
              <div>
                <h2 className="text-white text-xl font-bold mb-2">{t('book_title')}</h2>
                <h3 className="text-amber-100 dark:text-gray-300 text-2xl font-serif mb-3">{votingBook.title}</h3>
                <p className="text-amber-200 dark:text-gray-400 text-sm">
                  {t('book_authors', { count: collaborators })}
                </p>
                <p className="text-amber-200 dark:text-gray-400 mt-1 text-sm">
                  {t('book_progress', { current: Array.isArray(paragraphs) ? paragraphs.length : 0, max: maxParagraphs })}
                </p>
                <p className="text-amber-200 dark:text-gray-400 mt-1 text-sm">
                  {t('create_author')}：{authorShort}
                </p>
                <p className="text-amber-200 dark:text-gray-400 mt-1 text-sm">
                  {t('create_total_votes')}：{totalVotes}
                </p>
                <p className="text-amber-200 dark:text-gray-400 mt-1 text-sm">
                  {t('create_status')}：{votingBook.status === 0 ? t('create_status_ongoing') : t('create_status_archived')}
                </p>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-amber-200 dark:text-gray-400 text-sm">
                  {t('book_page', { current: pageIndex + 1, total: totalPages })}
                </span>
              </div>
            </div>
            {/* 书页内容 - 右侧或底部（移动设备） */}
            <div className={`
              ${isMobile ? 'w-full' : 'w-1/2'} 
              ${isMobile ? 'h-[calc(100vh-300px)]' : 'h-full'} 
              bg-white dark:bg-gray-900 p-0 relative perspective-[1500px] overflow-hidden
            `}>
              <AnimatePresence initial={false} custom={direction} mode="wait">
                <motion.div
                  key={pageIndex}
                  className="absolute top-0 left-0 w-full h-full bg-white dark:bg-gray-900 p-5 flex flex-col justify-between origin-[left_center]"
                  style={{ transformStyle: "preserve-3d" }}
                  custom={direction}
                  variants={pageVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={pageTransition}
                >
                  <div className="prose dark:prose-invert max-w-none overflow-y-auto h-[calc(100%-50px)] pb-4">
                    {/* 段落内容（链上数据） */}
                    {currentPageParagraphs.map((paragraph, idx) => (
                      <div 
                        key={idx} 
                        className={`${isMobile ? 'mb-5' : 'mb-8'} last:mb-4`}
                      >
                        <p className={
                          `${isMobile ? 'text-base' : 'text-lg'} 
                          leading-relaxed font-serif mb-1 pl-6 first-letter:text-xl first-letter:font-bold`
                        }>
                          {paragraph.content ? decompressFromBase64(paragraph.content) : paragraph.walrus_id}
                        </p>
                        <div className="flex justify-end items-center mt-0.5 text-xs text-gray-400 dark:text-gray-500 opacity-70">
                          <span className="mr-3 italic">—— {paragraph.author}</span>
                          <span className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                            </svg>
                            {paragraph.votes}
                          </span>
                        </div>
                      </div>
                    ))}
                    {/* 如果是最后一页且段落未满10段，显示提交表单 */}
                    {showSubmissionForm && (
                      <div className="mt-6 p-4 bg-amber-50 dark:bg-gray-800 rounded-lg">
                        <h4 className="text-lg font-medium text-amber-900 dark:text-amber-200 mb-2">
                          {isEditingTitle ? t('form_input_title') : t('form_input_paragraph')}
                        </h4>
                        <textarea
                          className="w-full p-2 border border-amber-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                          rows={3}
                          placeholder={isEditingTitle ? t('form_input_title_placeholder') : t('form_input_paragraph_placeholder')}
                          value={input}
                          onChange={handleInputChange}
                        ></textarea>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-sm text-amber-700 dark:text-amber-300">
                            {t('byte_count', { current: inputBytes, max: MAX_BYTES })}
                          </span>
                          <button
                            onClick={handleSubmit}
                            className="px-4 py-1 bg-amber-600 hover:bg-amber-700 dark:bg-amber-800 dark:hover:bg-amber-700 text-white rounded"
                            disabled={loading || !input.trim() || inputBytes > MAX_BYTES}
                          >
                            {loading ? t('form_submitting') : isEditingTitle ? t('form_submit_title') : t('form_submit_paragraph')}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between mt-2">
                    <button 
                      onClick={goToPrevPage}
                      disabled={pageIndex === 0 || flipping}
                      className={`p-2 rounded-full ${
                        pageIndex === 0 || flipping
                          ? 'text-gray-400 cursor-not-allowed' 
                          : 'text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-gray-800'
                      }`}
                    >
                      {t('btn_prev_page')}
                    </button>
                    <button 
                      onClick={goToNextPage}
                      disabled={pageIndex === totalPages - 1 || flipping}
                      className={`p-2 rounded-full ${
                        pageIndex === totalPages - 1 || flipping
                          ? 'text-gray-400 cursor-not-allowed' 
                          : 'text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-gray-800'
                      }`}
                    >
                      {t('btn_next_page')}
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>
              {/* 翻页时的阴影效果 */}
              {flipping && (
                <div 
                  className={`absolute inset-0 pointer-events-none ${
                    direction > 0 
                      ? 'bg-gradient-to-l from-black/10 to-transparent' 
                      : 'bg-gradient-to-r from-black/10 to-transparent'
                  }`}
                />
              )}
            </div>
          </div>
          {/* 书本阴影 */}
          <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-[90%] h-6 bg-black/20 dark:bg-black/40 filter blur-md rounded-full"></div>
        </div>
        {/* 操作卡片 */}
        <div className={`grid grid-cols-1 ${isMobile ? 'gap-4' : 'md:grid-cols-2 gap-6'} max-w-4xl mx-auto`}>
          <SlideUp delay={0.2}>
            <Link 
              to="/create" 
              className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow transform hover:-translate-y-1 transition-transform duration-300"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-xl text-primary-600 dark:text-primary-300">
                  ✍️
                </div>
                <h2 className="text-2xl font-semibold text-primary-800 dark:text-primary-200 ml-4">
                  {t('create_card_title')}
                </h2>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                {t('create_card_desc')}
              </p>
            </Link>
          </SlideUp>
          <SlideUp delay={0.4}>
            <Link 
              to="/story/latest" 
              className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow transform hover:-translate-y-1 transition-transform duration-300"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-secondary-100 dark:bg-secondary-900 flex items-center justify-center text-xl text-secondary-600 dark:text-secondary-300">
                  📚
                </div>
                <h2 className="text-2xl font-semibold text-primary-800 dark:text-primary-200 ml-4">
                  {t('browse_card_title')}
                </h2>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                {t('browse_card_desc')}
              </p>
            </Link>
          </SlideUp>
        </div>
      </div>
    </div>
  );
};

export default Home;