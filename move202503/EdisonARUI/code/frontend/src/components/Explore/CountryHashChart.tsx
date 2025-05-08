import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Alert } from '@mui/material';
import { getCountryHistoricalData, HashRateDataPoint, getStandardCountryName, getAllCountries } from './countryData';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import InsuranceInterface from '../Insurance/InsuranceInterface';

interface CountryHashChartProps {
  country: string;
}

const CountryHashChart: React.FC<CountryHashChartProps> = ({ country }) => {
  const [chartData, setChartData] = useState<HashRateDataPoint[]>([]);
  const [dataStatus, setDataStatus] = useState<{
    standardizedName: string;
    dataFound: boolean;
    errorMessage?: string;
  }>({ standardizedName: '', dataFound: false });

  useEffect(() => {
    try {
      // 标准化国家名称
      const standardizedName = getStandardCountryName(country);
      console.log('国家名称处理:', {
        original: country,
        standardized: standardizedName,
        availableCountries: getAllCountries()
      });
      
      // 获取国家的历史哈希率数据
      const historyData = getCountryHistoricalData(country);
      
      // 更新数据状态
      setDataStatus({
        standardizedName,
        dataFound: historyData.length > 0,
        errorMessage: historyData.length === 0 ? `未找到"${country}"的数据` : undefined
      });
      
      // 默认显示全部数据
      setChartData(historyData);
    } catch (error) {
      console.error('数据处理错误:', error);
      setDataStatus({
        standardizedName: '',
        dataFound: false,
        errorMessage: '数据处理过程中出错'
      });
      setChartData([]);
    }
  }, [country]);
  
  // 格式化日期的函数
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  };

  // 计算波动性指标函数
  const calculateVolatility = () => {
    if (chartData.length < 2) return { volatility: 0, trend: 'stable' };
    
    // 计算波动率
    const hashrates = chartData.map(d => d.absoluteHashRate);
    const avg = hashrates.reduce((a, b) => a + b, 0) / hashrates.length;
    const variance = hashrates.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / hashrates.length;
    const stdDev = Math.sqrt(variance);
    const volatility = stdDev / avg;
    
    // 计算趋势
    const firstHalf = hashrates.slice(0, Math.floor(hashrates.length / 2));
    const secondHalf = hashrates.slice(Math.floor(hashrates.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    let trend = 'stable';
    if (secondAvg > firstAvg * 1.1) trend = 'rising';
    else if (secondAvg < firstAvg * 0.9) trend = 'falling';
    
    return { volatility, trend };
  };

  // 获取波动性指标
  const { volatility, trend } = calculateVolatility();

  return (
    <Box sx={{ width: '100%', mt: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* 上方：挖矿哈希率历史数据 (高度1/3) */}
      <Box sx={{ flex: '1', width: '100%', mb: 2, minHeight: 0 }}>
        <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
          {dataStatus.errorMessage && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {dataStatus.errorMessage}
            </Alert>
          )}
          
          <Box sx={{ flex: 1, minHeight: 0 }}>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDate} 
                    minTickGap={30}
                  />
                  <YAxis 
                    yAxisId="left" 
                    orientation="left"
                    domain={[0, 'auto']}
                    label={{ value: 'Hashrate (EH/s)', angle: -90, position: 'insideLeft' }}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    domain={[0, 100]}
                    label={{ value: 'Percentage (%)', angle: 90, position: 'insideRight' }}
                  />
                  <Tooltip 
                    labelFormatter={formatDate}
                    formatter={(value, name) => {
                      if (name === 'absoluteHashRate') return [`${value} EH/s`, 'Hashrate'];
                      if (name === 'percentage') return [`${value}%`, 'Percentage'];
                      return [value, name];
                    }}
                  />
                  <Legend payload={[
                    { value: 'Hashrate (EH/s)', type: 'line', color: '#8884d8' },
                    { value: 'Percentage (%)', type: 'line', color: '#82ca9d' }
                  ]} />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="absoluteHashRate" 
                    stroke="#8884d8" 
                    activeDot={{ r: 8 }} 
                    name="Hashrate"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="percentage" 
                    stroke="#82ca9d" 
                    name="Percentage"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100%' 
              }}>
                <Typography variant="body1" color="text.secondary">
                  {dataStatus.errorMessage || 'Loading data...'}
                </Typography>
              </Box>
            )}
          </Box>
          
          {chartData.length > 0 && (
            <Box sx={{ mt: 1 }}>
              {/* <Typography variant="body2" color="text.secondary">
                波动性指标: {(volatility * 100).toFixed(2)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                趋势: {trend === 'rising' ? '上升' : trend === 'falling' ? '下降' : '稳定'}
              </Typography> */}
            </Box>
          )}
        </Paper>
      </Box>
      
      {/* 下方：算力波动保险 (高度1/3) */}
      <Box sx={{ flex: '1', width: '100%', minHeight: 0 }}>
        <Paper sx={{ p: 2, height: '100%', overflow: 'auto' }}>
          <InsuranceInterface country={country} compact={true} />
        </Paper>
      </Box>
    </Box>
  );
};

export default CountryHashChart; 