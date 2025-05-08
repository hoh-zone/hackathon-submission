import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Card, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Slider, 
  Stack 
} from '@mui/material';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { FormValues, TaskConfig } from './types';

interface TaskFormProps {
  onSubmit: (task: Omit<TaskConfig, 'id' | 'last_alert'>) => void;
  initialValues?: Partial<FormValues> | null;
}

const TaskForm = forwardRef<any, TaskFormProps>(({ onSubmit, initialValues }, ref) => {
  const currentAccount = useCurrentAccount();
  const [formValues, setFormValues] = useState<FormValues>({
    chain1: 'ethereum',
    chain2: 'sui',
    token1: 'ETH',
    token2: 'USDT',
    threshold: 0.5,
    cooldown: 300
  });

  const chainOptions = [
    { value: 'ethereum', label: 'Ethereum' },
    { value: 'binance', label: 'BSC' },
    { value: 'polygon', label: 'Polygon' },
    { value: 'avalanche', label: 'Avalanche' },
    { value: 'solana', label: 'Solana' },
    { value: 'sui', label: 'Sui' },
  ];

  const token1Options = [
    { value: 'ETH', label: 'ETH' },
    { value: 'BTC', label: 'BTC' },
    { value: 'BNB', label: 'BNB' },
    { value: 'SOL', label: 'SOL' },
    { value: 'SUI', label: 'SUI' },
  ];

  const token2Options = [
    { value: 'USDT', label: 'USDT' },
    { value: 'USDC', label: 'USDC' },
  ];

  // 应用初始值
  useEffect(() => {
    if (initialValues) {
      setFormValues(prev => ({
        ...prev,
        ...initialValues
      }));
    }
  }, [initialValues]);

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    resetForm: () => {
      setFormValues({
        chain1: 'ethereum',
        chain2: 'sui',
        token1: 'ETH',
        token2: 'USDT',
        threshold: 0.5,
        cooldown: 300
      });
    },
    setFormValues: (values: Partial<FormValues>) => {
      setFormValues(prev => ({
        ...prev,
        ...values
      }));
    }
  }));

  const handleChange = (field: keyof FormValues) => (event: any) => {
    const value = event.target.value;
    setFormValues(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSliderChange = (field: keyof FormValues) => (_: Event, value: number | number[]) => {
    setFormValues(prev => ({
      ...prev,
      [field]: typeof value === 'number' ? value : value[0]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentAccount) {
      alert('Please connect your wallet first');
      return;
    }

    // 准备提交数据
    const chainPairs = [
      `${formValues.chain1}:${formValues.token1}-${formValues.token2}`,
      `${formValues.chain2}:${formValues.token1}-${formValues.token2}`
    ];

    onSubmit({
      chain_pairs: chainPairs,
      threshold: formValues.threshold,
      cooldown: formValues.cooldown
    });
  };

  return (
    <Card sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Create Monitoring Task
      </Typography>

      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={3}>
          <Stack direction="row" spacing={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Chain 1</InputLabel>
              <Select
                value={formValues.chain1}
                onChange={handleChange('chain1')}
                label="Chain 1"
              >
                {chainOptions.map(option => (
                  <MenuItem 
                    key={option.value} 
                    value={option.value}
                    disabled={option.value === formValues.chain2}
                  >
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Chain 2</InputLabel>
              <Select
                value={formValues.chain2}
                onChange={handleChange('chain2')}
                label="Chain 2"
              >
                {chainOptions.map(option => (
                  <MenuItem 
                    key={option.value} 
                    value={option.value}
                    disabled={option.value === formValues.chain1}
                  >
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <Stack direction="row" spacing={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Token 1</InputLabel>
              <Select
                value={formValues.token1}
                onChange={handleChange('token1')}
                label="Token 1"
              >
                {token1Options.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Token 2</InputLabel>
              <Select
                value={formValues.token2}
                onChange={handleChange('token2')}
                label="Token 2"
              >
                {token2Options.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <Box>
            <Typography gutterBottom>
              Price Difference Threshold: {formValues.threshold.toFixed(2)}%
            </Typography>
            <Slider
              value={formValues.threshold}
              onChange={handleSliderChange('threshold')}
              min={0.1}
              max={5}
              step={0.1}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${value}%`}
            />
          </Box>

          <Box>
            <Typography gutterBottom>
              Alert Cooldown: {(formValues.cooldown / 60).toFixed(0)} minutes
            </Typography>
            <Slider
              value={formValues.cooldown}
              onChange={handleSliderChange('cooldown')}
              min={60}
              max={1800}
              step={60}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${value / 60}min`}
            />
          </Box>

          <Button 
            type="submit" 
            variant="contained" 
            color="primary"
            disabled={!currentAccount}
          >
            Create Task
          </Button>
        </Stack>
      </Box>
    </Card>
  );
});

export default TaskForm; 