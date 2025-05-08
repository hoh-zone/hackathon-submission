import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  TextField,
  Typography,
  styled,
} from '@mui/material';
import { Token } from '../../config/tokens';
import { BitcoinIcon, SuiIcon } from '../icons/CryptoIcons';

interface TokenSelectorProps {
  label: string;
  token: Token;
  balance: string;
  value: string;
  availableTokens: Token[];
  onChange: (value: string) => void;
  onTokenChange: (token: Token) => void;
}

const TokenButton = styled(Button)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(1),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.default,
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

const getTokenIcon = (icon: Token['icon']) => {
  switch (icon) {
    case 'BTC':
      return <BitcoinIcon />;
    case 'sBTC':
      return <BitcoinIcon sx={{ opacity: 0.8 }} />;
    case 'TEST_BTC':
      return <BitcoinIcon sx={{ opacity: 0.8 }} />;
    case 'SUI':
      return <SuiIcon />;
    default:
      return null;
  }
};

const TokenSelector: React.FC<TokenSelectorProps> = ({
  label,
  token,
  balance,
  value,
  availableTokens,
  onChange,
  onTokenChange,
}) => {
  const [open, setOpen] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleTokenSelect = (selectedToken: Token) => {
    onTokenChange(selectedToken);
    handleClose();
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Balance: {balance}
        </Typography>
      </Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          p: 2,
          borderRadius: 1,
          bgcolor: 'background.default',
        }}
      >
        <TokenButton onClick={handleClickOpen}>
          {getTokenIcon(token.icon)}
          <Typography sx={{ ml: 1 }}>{token.symbol}</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
            ({token.chain})
          </Typography>
        </TokenButton>
        <TextField
          fullWidth
          variant="standard"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          InputProps={{
            disableUnderline: true,
            sx: {
              textAlign: 'right',
              fontSize: '20px',
              input: { textAlign: 'right' },
            },
          }}
        />
      </Box>

      <Dialog onClose={handleClose} open={open}>
        <DialogTitle>Select Token</DialogTitle>
        <List sx={{ pt: 0 }}>
          {availableTokens.map((t) => (
            <ListItem disableGutters key={t.symbol}>
              <ListItemButton onClick={() => handleTokenSelect(t)}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {getTokenIcon(t.icon)}
                </ListItemIcon>
                <ListItemText 
                  primary={t.symbol} 
                  secondary={t.chain}
                  primaryTypographyProps={{
                    variant: 'body1',
                    fontWeight: t.symbol === token.symbol ? 'bold' : 'normal',
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Dialog>
    </Box>
  );
};

export default TokenSelector; 