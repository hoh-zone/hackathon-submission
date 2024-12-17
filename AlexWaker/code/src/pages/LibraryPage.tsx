// import React from 'react';
// import { useParams } from 'react-router-dom';

// const ImageDetail: React.FC = () => {
//   const { id } = useParams();
//   const images = [
//     {
//       id: 'john-von-neumann',
//       title: 'John von Neumann',
//       description: 'A mathematician and physicist known for game theory and computer science.',
//       url: 'https://pic.imgdb.cn/item/6756fd88d0e0a243d4e0b50d.webp',
//     },
//     {
//       id: 'isaac-newton',
//       title: 'Isaac Newton',
//       description: 'A physicist and mathematician who developed the laws of motion.',
//       url: 'https://pic.imgdb.cn/item/6756fd87d0e0a243d4e0b50c.webp',
//     },
//     {
//       id: 'victor-hugo',
//       title: 'Victor Hugo',
//       description: 'A French poet and novelist best known for Les Misérables.',
//       url: 'https://pic.imgdb.cn/item/6756fd87d0e0a243d4e0b50b.webp',
//     },
//     {
//       id: 'thomas-edison',
//       title: 'Thomas Edison',
//       description: 'An inventor and businessman known for the light bulb and phonograph.',
//       url: 'https://pic.imgdb.cn/item/6756fd76d0e0a243d4e0b506.webp',
//     },
//     {
//       id: 'leonardo-da-vinci',
//       title: 'Leonardo da Vinci',
//       description: 'An Italian artist, scientist, and polymath known for his paintings and inventions.',
//       url: 'https://pic.imgdb.cn/item/6756fd75d0e0a243d4e0b505.webp',
//     },
//     {
//       id: 'sigmund-freud',
//       title: 'Sigmund Freud',
//       description: 'An Austrian neurologist and the founder of psychoanalysis.',
//       url: 'https://pic.imgdb.cn/item/6756fd74d0e0a243d4e0b504.webp',
//     },
//     {
//       id: 'alexander-the-great',
//       title: 'Alexander the Great',
//       description: 'A Macedonian king known for his military conquests and the spread of Hellenistic culture.',
//       url: 'https://pic.imgdb.cn/item/6756fd73d0e0a243d4e0b503.webp',
//     },
//     {
//       id: 'adam-smith',
//       title: 'Adam Smith',
//       description: 'A Scottish economist and philosopher known for his work on the division of labor.',
//       url: 'https://pic.imgdb.cn/item/6756fd73d0e0a243d4e0b502.webp',
//     },
//   ];

//   const image = images.find((img) => img.id === id) || {
//     title: 'Unknown',
//     description: 'No information available.',
//     url: '',
//   };

//   return (
//     <div>
//       <h1>{image.title}</h1>
//       <p>{image.description}</p>
//       {/* 您可以在这里添加更多内容，例如图片、描述等 */}
//     </div>
//   );
// };

// export default ImageDetail;
import React from 'react';
import { useParams } from 'react-router-dom';

const LibraryContent: React.FC = () => {
  const { id } = useParams();
  const images = [
    {
      id: 'john-von-neumann',
      title: '计算机科学',
      description: 'A mathematician and physicist known for game theory and computer science.',
      url: 'https://pic.imgdb.cn/item/6756fd88d0e0a243d4e0b50d.webp',
    },
    {
      id: 'isaac-newton',
      title: '数学&物理学',
      description: 'A physicist and mathematician who developed the laws of motion.',
      url: 'https://pic.imgdb.cn/item/6756fd87d0e0a243d4e0b50c.webp',
    },
    {
      id: 'victor-hugo',
      title: '文学',
      description: 'A French poet and novelist best known for Les Misérables.',
      url: 'https://pic.imgdb.cn/item/6756fd87d0e0a243d4e0b50b.webp',
    },
    {
      id: 'thomas-edison',
      title: '发明&工程学',
      description: 'An inventor and businessman known for the light bulb and phonograph.',
      url: 'https://pic.imgdb.cn/item/6756fd76d0e0a243d4e0b506.webp',
    },
    {
      id: 'leonardo-da-vinci',
      title: '艺术',
      description: 'An Italian artist, scientist, and polymath known for his paintings and inventions.',
      url: 'https://pic.imgdb.cn/item/6756fd75d0e0a243d4e0b505.webp',
    },
    {
      id: 'sigmund-freud',
      title: '心理学',
      description: 'An Austrian neurologist and the founder of psychoanalysis.',
      url: 'https://pic.imgdb.cn/item/6756fd74d0e0a243d4e0b504.webp',
    },
    {
      id: 'alexander-the-great',
      title: '政治&社会学',
      description: 'A Macedonian king known for his military conquests and the spread of Hellenistic culture.',
      url: 'https://pic.imgdb.cn/item/6756fd73d0e0a243d4e0b503.webp',
    },
    {
      id: 'adam-smith',
      title: '金融&经济学',
      description: 'A Scottish economist and philosopher known for his work on the division of labor.',
      url: 'https://pic.imgdb.cn/item/6756fd73d0e0a243d4e0b502.webp',
    },
  ];

  const image = images.find((img) => img.id === id) || {
    title: 'Unknown',
    description: 'No information available.',
    url: '',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'row', width: '100%', height: '100vh', padding: '20px', boxSizing: 'border-box' }}>
      {/* A 部分：大图片 */}
      <div style={{ flex: 1, marginRight: '20px' }}>
        <img 
          src={image.url} 
          alt="Large Display" 
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' }}
        />
      </div>

      {/* B 和 C 部分 */}
      <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* B 部分：展示一段话 */}
        <div style={{ flex: 1, backgroundColor: '#000000', padding: '20px', borderRadius: '10px', overflow: 'auto' }}>
          <h2>{image.title}</h2>
          <p>
            {image.description}
          </p>
        </div>

        {/* C 部分：可滚动的小窗口 */}
        <div style={{ flex: 1.5, backgroundColor: '#000000', padding: '20px', border: '1px solid #ccc', borderRadius: '10px', overflowY: 'scroll' }}>
          <h3>相关内容</h3>
          <ul style={{ listStyleType: 'none', padding: '0', margin: '0' }}>
            {Array.from({ length: 20 }).map((_, index) => (
              <li key={index} style={{ marginBottom: '10px', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}>
                相关条目 {index + 1}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LibraryContent;

// import React from 'react';

// const NewPage: React.FC = () => {

// };

// export default NewPage;
