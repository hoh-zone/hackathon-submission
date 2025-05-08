import React, { useRef, useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import TaskForm from './TaskForm';
import { RegionTaskProps, FormValues, TaskConfig } from './types';

const RegionTask: React.FC<RegionTaskProps> = ({ region, onClose, onSubmit }) => {
  const taskFormRef = useRef<any>(null);

  // 根据 region 数据准备初始表单值
  const initialValues = useMemo<Partial<FormValues>>(() => {
    if (!region) return {};

    // 根据 region 名称选择合适的链
    const getChainByRegion = (regionName: string): string => {
      const regionToChain: Record<string, string> = {
        'China': 'sui',
        'USA': 'ethereum',
        'Europe': 'polygon',
        'Japan': 'solana',
        'Korea': 'binance',
        // 可以添加更多映射
      };
      
      return regionToChain[regionName] || 'ethereum';
    };

    // 设置默认值
    return {
      chain1: getChainByRegion(region.name),
      chain2: 'sui', // 默认与 Sui 进行对比
      token1: 'ETH', // 可以根据 region 选择适当的代币
      token2: 'USDT',
      threshold: region.spread > 0 ? region.spread * 0.5 : 0.5, // 根据当前价差设置阈值
      cooldown: 300 // 默认 5 分钟
    };
  }, [region]);

  const handleSubmit = (task: Omit<TaskConfig, 'id' | 'last_alert'>) => {
    onSubmit(task);
    onClose();
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        为 {region?.name || ''} 创建监控任务
      </Typography>
      <TaskForm
        ref={taskFormRef}
        initialValues={initialValues}
        onSubmit={handleSubmit}
      />
    </Box>
  );
};

export default RegionTask; 