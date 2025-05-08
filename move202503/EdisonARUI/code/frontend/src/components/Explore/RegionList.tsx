import React, { useState, useEffect } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Region } from './types';
import { SuiClient } from '@mysten/sui/client';
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import CountryHashChart from './CountryHashChart';

interface RegionListProps {
  regions: Region[];
  sortBy: keyof Region;
  sortDirection: 'asc' | 'desc';
  onSort: (field: keyof Region) => void;
  currentAccount: { address: string } | null;
  signAndExecuteTransaction: ReturnType<typeof useSignAndExecuteTransaction>['mutate'];
  suiClient: SuiClient;
}

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  color: theme.palette.text.primary,
  '&.header': {
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
  },
}));

export const RegionList: React.FC<RegionListProps> = ({
  regions,
  sortBy,
  sortDirection,
  onSort,
  currentAccount,
  signAndExecuteTransaction,
  suiClient,
}) => {
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // 在组件加载或regions变化时自动选中第一个国家
  useEffect(() => {
    if (regions.length > 0 && !selectedRegion) {
      setSelectedRegion(regions[0]);
    }
  }, [regions, selectedRegion]);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const formatPercentage = (num: number) => {
    return `${formatNumber(num)}%`;
  };
  
  const handleRowClick = (region: Region) => {
    setSelectedRegion(region);
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: 2,
      height: 'calc(100vh - 200px)', // 设置高度填充页面，留出头部空间
      width: '100%'
    }}>
      <Box sx={{ 
        display: 'flex', 
        gap: 3, 
        height: '100%',
        width: '100%'
      }}>
        {/* 左侧表格 */}
        <Box sx={{ flex: '1 1 50%', height: '100%', overflow: 'auto' }}>
          <TableContainer 
            component={Paper} 
            sx={{ 
              backgroundColor: 'background.paper',
              height: '100%'
            }}
          >
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <StyledTableCell className="header" onClick={() => onSort('name')}>
                    Country/Region
                  </StyledTableCell>
                  <StyledTableCell className="header" onClick={() => onSort('totalOI')}>
                    Hashrate (EH/s)
                  </StyledTableCell>
                  <StyledTableCell className="header" onClick={() => onSort('totalOIPercentage')}>
                    Percentage (%)
                  </StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {regions.map((region) => (
                  <TableRow 
                    key={region.id} 
                    hover 
                    onClick={() => handleRowClick(region)}
                    sx={{ 
                      cursor: 'pointer',
                      backgroundColor: selectedRegion?.id === region.id ? 'rgba(25, 118, 210, 0.08)' : 'inherit'
                    }}
                  >
                    <StyledTableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1">{region.name}</Typography>
                      </Box>
                    </StyledTableCell>
                    <StyledTableCell>
                      <Typography variant="body2">{formatNumber(region.totalOI / 1000000)}</Typography>
                    </StyledTableCell>
                    <StyledTableCell>
                      <Typography variant="body2">{formatPercentage(region.totalOIPercentage)}</Typography>
                    </StyledTableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
        
        {/* 右侧图表区域 */}
        <Box sx={{ flex: '1 1 50%', height: '100%', overflow: 'auto' }}>
          {selectedRegion ? (
            <CountryHashChart country={selectedRegion.name} />
          ) : (
            <Box 
              sx={{ 
                display: 'flex', 
                height: '100%',
                justifyContent: 'center', 
                alignItems: 'center', 
                backgroundColor: 'background.paper',
                border: 1,
                borderColor: 'divider',
                borderRadius: 1
              }}
            >
              <Typography variant="body1" color="text.secondary">
                Please select a country/region to view details
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
    </Box>
  );
}; 