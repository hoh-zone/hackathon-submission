import React from 'react';
import { Link } from 'react-router-dom';
import { ConnectButton } from '@mysten/dapp-kit';
import { Box } from '@radix-ui/themes';
import './MainPage.css';

const MainPage: React.FC = () => {
  const images = [
    {
      id: 'john-von-neumann',
      title: 'John von Neumann',
      description: 'A mathematician and physicist known for game theory and computer science.',
      url: 'https://pic.imgdb.cn/item/6756fd88d0e0a243d4e0b50d.webp',
    },
    {
      id: 'isaac-newton',
      title: 'Isaac Newton',
      description: 'A physicist and mathematician who developed the laws of motion.',
      url: 'https://pic.imgdb.cn/item/6756fd87d0e0a243d4e0b50c.webp',
    },
    {
      id: 'victor-hugo',
      title: 'Victor Hugo',
      description: 'A French poet and novelist best known for Les Misérables.',
      url: 'https://pic.imgdb.cn/item/6756fd87d0e0a243d4e0b50b.webp',
    },
    {
      id: 'thomas-edison',
      title: 'Thomas Edison',
      description: 'An inventor and businessman known for the light bulb and phonograph.',
      url: 'https://pic.imgdb.cn/item/6756fd76d0e0a243d4e0b506.webp',
    },
    {
      id: 'leonardo-da-vinci',
      title: 'Leonardo da Vinci',
      description: 'An Italian artist, scientist, and polymath known for his paintings and inventions.',
      url: 'https://pic.imgdb.cn/item/6756fd75d0e0a243d4e0b505.webp',
    },
    {
      id: 'sigmund-freud',
      title: 'Sigmund Freud',
      description: 'An Austrian neurologist and the founder of psychoanalysis.',
      url: 'https://pic.imgdb.cn/item/6756fd74d0e0a243d4e0b504.webp',
    },
    {
      id: 'alexander-the-great',
      title: 'Alexander the Great',
      description: 'A Macedonian king known for his military conquests and the spread of Hellenistic culture.',
      url: 'https://pic.imgdb.cn/item/6756fd73d0e0a243d4e0b503.webp',
    },
    {
      id: 'adam-smith',
      title: 'Adam Smith',
      description: 'A Scottish economist and philosopher known for his work on the division of labor.',
      url: 'https://pic.imgdb.cn/item/6756fd73d0e0a243d4e0b502.webp',
    },
  ];
  
  return (
    <Box className="app">
      <header className="header">
        <Box className="logo">LHFA</Box>
        <nav className="nav">
          <a href="#">Home</a>
          <a href="#">About</a>
          <a href="#">Contact</a>
        </nav>
        <Box className="buttons">
          <ConnectButton />
        </Box>
      </header>
      <Box className="main">
        <Box className="main-title" style={{ marginTop: '0' }}>
          <h1>Welcome to the Library of Human Freedom Academy</h1>
        </Box>
        <Box className="main-description" style={{ maxWidth: '800px', margin: '0 auto', marginTop: '0px' }}>
          <h2>
            This is a free academic website built on the Walrus, where you can publish your papers or explore anyone
            else's ideas.
          </h2>
        </Box>
        <Box className="search-box" style={{ width: '70%', marginTop: '30px' }}>
          <input
            type="text"
            placeholder="Search..."
            style={{
              borderRadius: '50px',
              width: '100%',
              padding: '20px',
              border: '1px solid #ccc',
            }}
          />
        </Box>
        <Box className="image-gallery" style={{ width: '80%', display: 'flex', flexWrap: 'wrap', marginTop: '30px' }}>
          {images.map((image) => (
            <Box key={image.id} style={{ flex: '1 0 21%', margin: '10px' }}>
              <Link to={`/image-detail/${image.id}`}>
                <img
                  src={image.url}
                alt="Image 1"
                style={{ width: '100%', borderRadius: '10px' }}
              />
            </Link>
          </Box>
          ))}
        </Box>
      </Box>
      <Box className="footer">
        <footer className="footer">
          <p>&copy; 2024 My Website. All rights reserved.</p>
        </footer>
      </Box>
    </Box>
  );
};

export default MainPage;
