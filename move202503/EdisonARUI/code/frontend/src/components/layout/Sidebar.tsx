import React from 'react';
import {
  Box,
  Button,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  styled,
  Divider
} from '@mui/material';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import DownloadIcon from '@mui/icons-material/Download';
import ExploreIcon from '@mui/icons-material/Explore';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import MapIcon from '@mui/icons-material/Map';
import ReceiptIcon from '@mui/icons-material/Receipt';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  isOpen: boolean;
  width: number;
}

interface StyledDrawerProps {
  drawerwidth: number;
}

const StyledDrawer = styled(Drawer, {
  shouldForwardProp: (prop) => prop !== 'drawerwidth',
})<StyledDrawerProps>(({ theme, drawerwidth }) => ({
  width: drawerwidth,
  flexShrink: 0,
  '& .MuiDrawer-paper': {
    width: drawerwidth,
    boxSizing: 'border-box',
    backgroundColor: theme.palette.background.paper,
    borderRight: `1px solid ${theme.palette.divider}`,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    zIndex: theme.zIndex.drawer,
    height: 'calc(100% - 64px)',
    top: '64px',
    display: 'flex',
    flexDirection: 'column',
  },
}));

const DepositButton = styled(Button)(({ theme }) => ({
  width: '100%',
  padding: '12px',
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.common.white,
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: 500,
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
  },
}));

const menuItems = [
  { id: 'explore', text: 'Explore', icon: <ExploreIcon /> },
  // { id: 'swap', text: 'Swap', icon: <SwapHorizIcon /> },
  { id: 'liquidity', text: 'Facuet', icon: <WaterDropIcon /> },
  { id: 'bondpool', text: 'Bond', icon: <AccountBalanceIcon /> },
  { id: 'policies', text: 'Policies', icon: <ReceiptIcon /> },
];

const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onPageChange,
  isOpen,
  width,
}) => {
  const handleMenuClick = (pageId: string) => {
    console.log('Menu clicked:', pageId);
    onPageChange(pageId);
  };

  // 创建菜单项
  const renderMenuItem = (item: { id: string; text: string; icon: React.ReactNode }) => (
    <ListItem key={item.id} disablePadding>
      <ListItemButton
        selected={currentPage === item.id}
        onClick={() => handleMenuClick(item.id)}
        sx={{
          minHeight: 56,
          px: 1.9,
          borderRadius: '8px',
          mx: 1,
          mb: 0.5,
          '&.Mui-selected': {
            backgroundColor: 'rgba(30, 136, 229, 0.15)',
            color: 'primary.main',
            '& .MuiListItemIcon-root': {
              color: 'primary.main',
            },
          },
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
          },
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: 36,
            mr: isOpen ? 2 : 'auto',
            justifyContent: 'center',
            color: currentPage === item.id ? 'primary.main' : 'text.secondary',
          }}
        >
          {item.icon}
        </ListItemIcon>
        {isOpen && (
          <ListItemText
            primary={item.text}
            sx={{
              opacity: isOpen ? 1 : 0,
              color: currentPage === item.id ? 'primary.main' : 'text.primary',
              '& .MuiTypography-root': {
                fontWeight: currentPage === item.id ? 'bold' : 'normal',
              },
            }}
          />
        )}
      </ListItemButton>
    </ListItem>
  );

  return (
    <StyledDrawer
      variant="permanent"
      open={isOpen}
      drawerwidth={width}
    >
      <List sx={{ pt: 1 }}>
        {menuItems.map(renderMenuItem)}
        
        {isOpen && <Divider sx={{ my: 1 }} />}
      </List>
      <Box sx={{ 
        mt: 'auto',
        p: 2,
        borderTop: 1,
        borderColor: 'divider',
        position: 'sticky',
        bottom: 0,
        backgroundColor: 'background.paper',
      }}>
        {isOpen ? (
          <DepositButton fullWidth onClick={() => onPageChange('bondpool')}>
            Deposit
          </DepositButton>
        ) : (
          <DepositButton
            sx={{
              minWidth: '40px',
              width: '40px',
              height: '40px',
              padding: 0,
              borderRadius: '50%',
              margin: '0 auto',
            }}
            onClick={() => onPageChange('bondpool')}
          >
            <DownloadIcon />
          </DepositButton>
        )}
      </Box>
    </StyledDrawer>
  );
};

export default Sidebar;