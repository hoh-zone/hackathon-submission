import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { useWallet } from '@suiet/wallet-kit';
import { compressToBase64, decompressFromBase64 } from 'lz-string';
// TODO: 替换为你刚刚发布成功的 PACKAGE_ID 和 StoryBook 对象ID
const PACKAGE_ID = import.meta.env.VITE_PACKAGE_ID;
const STORYBOOK_ID = import.meta.env.VITE_STORYBOOK_ID;
const TREASURY_ID = import.meta.env.VITE_TREASURY_ID;
// 切换为 testnet
const suiClient = new SuiClient({ url: getFullnodeUrl(import.meta.env.VITE_SUI_NETWORK) });
// Walrus 官方 Testnet 节点（已弃用，保留注释）
// const WALRUS_PUBLISHER = 'https://publisher.walrus-testnet.walrus.space';
// const WALRUS_AGGREGATOR = 'https://aggregator.walrus-testnet.walrus.space';
/**上传内容到 Walrus，返回 blobId
  async function uploadToWalrus(content: Blob | string, epochs: number = 1): Promise<string> {
  const url = `${WALRUS_PUBLISHER}/v1/blobs?epochs=${epochs}`;
  const res = await fetch(url, {
    method: 'PUT',
    body: content,
  });
  if (!res.ok) throw new Error('Walrus 上传失败');
   const data = await res.json();

  if (data.newlyCreated) {
    return data.newlyCreated.blobObject.blobId;
  } else if (data.alreadyCertified) {
    return data.alreadyCertified.blobId;
  } else {
    throw new Error('Walrus 返回格式异常');
  }
}

// 从 Walrus 公共 Aggregator 下载 blob
async function downloadFromWalrus(blobId: string): Promise<Blob> {
  const url = `${WALRUS_AGGREGATOR}/v1/blobs/${blobId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Walrus 下载失败');
  return await res.blob();
}
*/
// 计算内容哈希（sha256，返回hex字符串）
async function calcContentHash(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}
type BookType = {
  id: string;
  title: string;
  status: number;
  index: number;
  paragraphs: unknown[];
  archive_votes_threshold: number;
  total_votes: number;
};

async function getCurrentBook(): Promise<BookType | null> {
  const storyBookObj = await suiClient.getObject({ id: STORYBOOK_ID, options: { showContent: true } });
  const fields = (storyBookObj.data?.content as any)?.fields;
  const books = (fields?.books || []).map(unpack);
  if (books.length === 0) {
    // 没有书，返回 null
    return null;
  }
  const idx = fields?.current_book_index ?? 0;
  const book = books[idx] ?? {};
  // 段落也解包
  book.paragraphs = unpackParagraphs(book.paragraphs);
  return {
    id: book.id || '',
    title: book.title ?? '',
    status: book.status ?? 0,
    index: book.index ?? 0,
    paragraphs: book.paragraphs,
    archive_votes_threshold: book.archive_votes_threshold ?? 10,
    total_votes: book.total_votes ?? 0,
  };
}

// 工具函数：统一解包链上对象
function unpack(obj: any) {
  if (!obj) return obj;
  if (obj.fields) {
    return { ...obj.fields, id: obj.fields.id || obj.id || obj.objectId };
  }
  return { ...obj };
}

// 工具函数：解包段落数组
function unpackParagraphs(paragraphs: unknown[] = []): Record<string, any>[] {
  return paragraphs.map((p, i) => {
    const para = unpack(p);
    return {
      ...para,
      index: i,
    };
  });
}

// 工具函数：获取段落内容（直接链上 content 字段，lz-string 解压）
async function getParagraphContent(para: any) {
  if (para.content) {
    try {
      return decompressFromBase64(para.content) || '';
    } catch {
      return para.content; // 解压失败时直接返回原文
    }
  }
  return '';
}

export function useSuiStory() {
  const wallet = useWallet();

  // 1. 开启新书
  async function startNewBook(title: string) {
    if (!wallet.connected || !wallet.account?.address) throw new Error('请先连接钱包');
    const tx = new Transaction();
    tx.moveCall({
      target: `${PACKAGE_ID}::story::start_new_book`,
      arguments: [
        tx.object(STORYBOOK_ID),
        tx.pure.string(title),
        tx.pure.address(wallet.account.address),
        tx.object(TREASURY_ID),
      ],
    });
    return await wallet.signAndExecuteTransaction({ transaction: tx });
  }

  // 2. 添加段落（直接压缩明文内容上链）
  async function addParagraph(content: string) {
    if (!wallet.connected || !wallet.account?.address) throw new Error('请先连接钱包');
    const compressed = compressToBase64(content);
    const tx = new Transaction();
    tx.moveCall({
      target: `${PACKAGE_ID}::story::add_paragraph`,
      arguments: [
        tx.object(STORYBOOK_ID),
        tx.pure.string(compressed),
        tx.pure.address(wallet.account.address),
        tx.object(TREASURY_ID),
      ],
    });
    return await wallet.signAndExecuteTransaction({ transaction: tx });
  }

  // 3. 投票
  async function voteParagraph(paraIndex: number) {
    if (!wallet.connected || !wallet.account?.address) throw new Error('请先连接钱包');
    const tx = new Transaction();
    tx.moveCall({
      target: `${PACKAGE_ID}::story::vote_paragraph`,
      arguments: [
        tx.object(STORYBOOK_ID),
        tx.pure.u64(paraIndex),
      ],
    });
    return await wallet.signAndExecuteTransaction({ transaction: tx });
  }

  // 4. 归档书本
  async function archiveBook() {
    if (!wallet.connected || !wallet.account?.address) throw new Error('请先连接钱包');
    const tx = new Transaction();
    tx.moveCall({
      target: `${PACKAGE_ID}::story::archive_book`,
      arguments: [
        tx.object(STORYBOOK_ID),
        tx.object(TREASURY_ID),
      ],
    });
    return await wallet.signAndExecuteTransaction({ transaction: tx });
  }

  // 5. 查询所有书（已解包，段落也解包）
  async function getAllBooks() {
    const storyBookObj = await suiClient.getObject({ id: STORYBOOK_ID, options: { showContent: true } });
    const fields = (storyBookObj.data?.content as any)?.fields;
    const books = (fields?.books || []).map(unpack);
    books.forEach((book: Record<string, any>) => {
      book.paragraphs = unpackParagraphs(book.paragraphs);
    });
    return books as BookType[];
  }

  // 6. 查询某本书下所有段落（已解包）
  async function getAllParagraphs(book: { paragraphs: unknown[] }) {
    return unpackParagraphs(book.paragraphs);
  }

  // 新增：通过 index 获取书本
  async function getBookByIndex(index: number) {
    const books = await getAllBooks();
    return books.find((b: { index: number | string }) => Number(b.index) === Number(index));
  }

  // 新增：获取段落内容（通过 walrus_id 下载）
  async function getAllParagraphContents(book: { paragraphs: unknown[] }) {
    const paras = await getAllParagraphs(book);
    return Promise.all(paras.map(p => getParagraphContent(p)));
  }

  // 添加段落并归档（合并为一个链上交易）
  async function addParagraphAndArchive(content: string) {
    if (!wallet.connected || !wallet.account?.address) throw new Error('请先连接钱包');
    const compressed = compressToBase64(content);
    const tx = new Transaction();
    tx.moveCall({
      target: `${PACKAGE_ID}::story::add_paragraph`,
      arguments: [
        tx.object(STORYBOOK_ID),
        tx.pure.string(compressed),
        tx.pure.address(wallet.account.address),
        tx.object(TREASURY_ID),
      ],
    });
    tx.moveCall({
      target: `${PACKAGE_ID}::story::archive_book`,
      arguments: [
        tx.object(STORYBOOK_ID),
        tx.object(TREASURY_ID),
      ],
    });
    return await wallet.signAndExecuteTransaction({ transaction: tx });
  }

  // 用 index 查找，用 id 调用奖励
  async function rewardForBookIndex(index: number) {
    const books = await getAllBooks();
    const book = books.find(b => b.index === index);
    if (!book) throw new Error('Book not found');
    // 这里用 book.id 作为 story_id
    const tx = new Transaction();
    tx.moveCall({
      target: `${PACKAGE_ID}::token::reward_start_new_book`,
      arguments: [
        tx.object(TREASURY_ID),
        tx.object(book.id),
      ],
    });
    return await wallet.signAndExecuteTransaction({ transaction: tx });
  }

  return {
    startNewBook,
    addParagraph,
    addParagraphAndArchive,
    voteParagraph,
    archiveBook,
    getAllBooks,
    getAllParagraphs,
    getBookByIndex,
    getAllParagraphContents,
    calcContentHash,
    getCurrentBook,
    rewardForBookIndex,
  };
} 