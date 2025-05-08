import React, { useState } from 'react';
import { Box, CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import SwapInterface from './components/swap/SwapInterface';
import BondPool from './components/BondPool/BondPool';
import { Explore } from './components/Explore';
import LiquidityInterface from './components/Liquidity/LiquidityInterface';
import PolicyList from './components/Insurance/PolicyList';
import InsuranceInterface from './components/Insurance/InsuranceInterface';
import LogPanel from './components/layout/LogPanel';

const DRAWER_WIDTH = 240;
const DRAWER_WIDTH_COLLAPSED = 72;

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#1E88E5',
    },
    background: {
      default: '#0A1929',
      paper: '#132F4C',
    },
    divider: 'rgba(194, 224, 255, 0.08)',
  },
  zIndex: {
    drawer: 1100,
    appBar: 1200,
  },
});

const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState('explore');

  const handleMenuClick = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handlePageChange = (page: string) => {
    console.log('Changing page to:', page);
    setCurrentPage(page);
  };

  const renderContent = () => {
    console.log('Current page:', currentPage);
    switch (currentPage) {
      case 'explore':
        return <Explore />;
      case 'swap':
        return <SwapInterface />;
      case 'liquidity':
        return <LiquidityInterface />;
      case 'bondpool':
        return <BondPool />;
      case 'policies':
        return <PolicyList />;
      case 'insurance':
        return <InsuranceInterface />;
      default:
        return <Explore />;
    }
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
        <CssBaseline />
        <Header onMenuClick={handleMenuClick} />
        <Sidebar
          currentPage={currentPage}
          onPageChange={handlePageChange}
          isOpen={isSidebarOpen}
          width={isSidebarOpen ? DRAWER_WIDTH : DRAWER_WIDTH_COLLAPSED}
        />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: { sm: `calc(100% - ${isSidebarOpen ? DRAWER_WIDTH : DRAWER_WIDTH_COLLAPSED}px)` },
            ml: { sm: `${isSidebarOpen ? DRAWER_WIDTH : DRAWER_WIDTH_COLLAPSED}px` },
            mt: '64px',
          }}
        >
          {renderContent()}
        </Box>
        
        {/* 全局日志面板 */}
        <LogPanel />
      </Box>
    </ThemeProvider>
  );
};

export default App; 