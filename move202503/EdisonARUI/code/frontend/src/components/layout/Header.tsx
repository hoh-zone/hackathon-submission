import React from 'react';
import {
  AppBar,
  Box,
  IconButton,
  Stack,
  Toolbar,
  Typography,
  styled,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { ConnectButton } from '@mysten/dapp-kit';

interface HeaderProps {
  onMenuClick: () => void;
}

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  borderBottom: `1px solid ${theme.palette.divider}`,
  boxShadow: 'none',
  zIndex: theme.zIndex.drawer + 1,
}));

const LogoImage = styled('img')({
  width: 36,
  height: 36,
  marginRight: 8,
  borderRadius: '50%',
  objectFit: 'cover',
});

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  return (
    <StyledAppBar position="fixed">
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          onClick={onMenuClick}
          edge="start"
          sx={{ ml: 0.01,mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        <LogoImage src="/images/icon.png" alt="HashCAT" />
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          HashCAT
        </Typography>
        <Box>
          <ConnectButton />
        </Box>
      </Toolbar>
    </StyledAppBar>
  );
};

export default Header; 