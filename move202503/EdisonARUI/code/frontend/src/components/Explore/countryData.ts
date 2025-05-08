import { Region } from './types';

// 使用异步方式加载CSV数据
let csvRawData = '';

// 加载CSV文件函数
export const loadCsvData = async (): Promise<string> => {
  try {
    // 使用fetch API加载CSV文件
    // 注意：路径是相对于public目录的，确保CSV文件已放在正确位置
    const response = await fetch('/data/Evolution of country share.csv');
    if (!response.ok) {
      throw new Error(`无法加载CSV数据: ${response.statusText}`);
    }
    const csvData = await response.text();
    return csvData;
  } catch (error) {
    console.error('加载CSV数据失败:', error);
    // 返回空字符串或者抛出错误
    return '';
  }
};

// 定义哈希率数据点类型
export interface HashRateDataPoint {
  date: string;
  percentage: number;
  absoluteHashRate: number;
}

// 添加国家名称标准化和映射相关代码
// 国家名称标准化：移除多余空格、星号、特殊标记等
export const normalizeCountryName = (name: string): string => {
  return name.trim()
    .replace(/\s*\*$/, '') // 移除末尾星号及空格
    .replace(/Mainland\s+/, '') // 移除"Mainland "前缀
    .replace(/,.*$/, '') // 移除逗号及其后内容（如"Iran, Islamic Rep."变为"Iran"）
    .toUpperCase(); // 统一转为大写以便不区分大小写
};

// 国家名称原始值到标准化值的映射表
export const countryNameMap: { [standardName: string]: string[] } = {
  'UNITED STATES': ['United States', 'USA', 'US', 'United States of America'],
  'CHINA': ['Mainland China', 'China', 'PRC'],
  'RUSSIAN FEDERATION': ['Russian Federation', 'Russia'],
  'IRAN': ['Iran, Islamic Rep.', 'Iran'],
  'GERMANY': ['Germany *', 'Germany'],
  'IRELAND': ['Ireland *', 'Ireland']
};

// 反向映射：从标准化名称查找原始显示名称
export const standardToDisplayName: { [standardName: string]: string } = {
  'UNITED STATES': 'United States',
  'CHINA': 'Mainland China',
  'RUSSIAN FEDERATION': 'Russian Federation',
  'IRAN': 'Iran, Islamic Rep.',
  'GERMANY': 'Germany *',
  'IRELAND': 'Ireland *'
};

// 根据任意形式的国家名称获取标准化名称
export const getStandardCountryName = (name: string): string => {
  const normalized = normalizeCountryName(name);
  
  // 在映射表中查找匹配项
  for (const [standard, variants] of Object.entries(countryNameMap)) {
    if (variants.some(variant => normalizeCountryName(variant) === normalized)) {
      return standard;
    }
  }
  
  // 如果没有特定映射，则返回标准化后的名称
  return normalized;
};

// 根据标准化国家名称获取显示名称
export const getDisplayCountryName = (standardName: string): string => {
  return standardToDisplayName[standardName] || standardName;
};

// 解析CSV数据
export const parseAllCsvData = (rawData: string): { [country: string]: HashRateDataPoint[] } => {
  if (!rawData) {
    console.error('CSV数据为空');
    return {};
  }

  const lines = rawData.trim().split('\n');
  if (lines.length < 2) {
    console.error('CSV数据格式不正确，至少需要标题行和一行数据');
    return {};
  }
  
  // 验证标题行
  const headerLine = lines[0].toLowerCase();
  if (!headerLine.includes('date') || 
      !headerLine.includes('country') || 
      !headerLine.includes('hashrate') || 
      !headerLine.includes('absolute')) {
    console.error('CSV标题行格式不正确，无法识别必要列');
    return {};
  }
  
  const countryData: { [country: string]: HashRateDataPoint[] } = {};
  
  // 从第二行开始解析（跳过标题行）
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    if (values.length < 4) {
      console.warn(`跳过行 ${i+1}，格式不正确: ${lines[i]}`);
      continue; // 跳过无效行
    }
    
    try {
      const date = values[0].trim();
      const rawCountryName = values[1].replace(/"/g, '').trim(); // 移除引号
      const hashRatePercentage = parseFloat(values[2].replace('%', ''));
      const absoluteHashRate = parseFloat(values[3]);
      
      // 验证数据有效性
      if (isNaN(hashRatePercentage) || isNaN(absoluteHashRate) || !date || !rawCountryName) {
        console.warn(`跳过行 ${i+1}，数据无效: ${lines[i]}`);
        continue;
      }
      
      // 标准化国家名称
      const standardCountryName = getStandardCountryName(rawCountryName);
      
      // 初始化国家数据数组（如果不存在）
      if (!countryData[standardCountryName]) {
        countryData[standardCountryName] = [];
      }
      
      // 添加数据点
      countryData[standardCountryName].push({
        date,
        percentage: hashRatePercentage,
        absoluteHashRate
      });
    } catch (error) {
      console.error(`解析行 ${i+1} 时出错: ${error}`);
    }
  }
  
  // 按日期排序每个国家的数据
  Object.keys(countryData).forEach(country => {
    countryData[country].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  });
  
  console.log(`成功解析 ${Object.keys(countryData).length} 个国家的数据`);
  
  return countryData;
};

// 初始化数据变量，但需要稍后加载
let allCountryData: { [country: string]: HashRateDataPoint[] } = {};
let countryRegions: Region[] = [];

// 初始化函数
export const initializeData = async (): Promise<void> => {
  try {
    // 加载CSV数据
    csvRawData = await loadCsvData();
    
    // 解析数据
    allCountryData = parseAllCsvData(csvRawData);
    
    // 处理区域数据
    countryRegions = processCountryData();
    
    console.log('数据初始化完成!');
  } catch (error) {
    console.error('数据初始化失败:', error);
  }
};

// 获取所有唯一的国家名称（使用标准化后的名称）
export const getAllCountries = (): string[] => {
  return Object.keys(allCountryData);
};

// 获取所有可用的显示用国家名称
export const getAllDisplayCountries = (): string[] => {
  return getAllCountries().map(standardName => getDisplayCountryName(standardName));
};

// 获取特定国家的历史哈希率数据
export const getCountryHistoricalData = (country: string): HashRateDataPoint[] => {
  // 将输入的国家名称标准化后再检索数据
  const standardName = getStandardCountryName(country);
  return allCountryData[standardName] || [];
};

// 获取所有可用的日期（用于时间轴）
export const getAllDates = (): string[] => {
  const dates = new Set<string>();
  
  Object.values(allCountryData).forEach(countryData => {
    countryData.forEach(dataPoint => {
      dates.add(dataPoint.date);
    });
  });
  
  return Array.from(dates).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
};

// 处理CSV数据并转换为Region格式（用于显示列表）
export const processCountryData = (): Region[] => {
  const countries = getAllCountries();
  const latestDate = getAllDates().pop() || ''; // 获取最新日期
  
  // 将处理后的数据转换为Region格式
  const regions: Region[] = countries.map((standardCountryName, index) => {
    // 获取显示用的国家名称
    const displayName = getDisplayCountryName(standardCountryName);
    
    // 获取该国家最新的数据点
    const countryData = allCountryData[standardCountryName];
    const latestDataPoint = countryData.length > 0 ? 
      countryData.find(d => d.date === latestDate) || countryData[countryData.length - 1] : 
      { percentage: 0, absoluteHashRate: 0 };
    
    // 为价格历史图表准备数据
    // 我们使用实际的哈希率历史数据，而不是随机生成的数据
    const priceHistory = countryData.length > 0 ? 
      countryData.map(d => d.absoluteHashRate) : 
      Array(24).fill(0);
    
    return {
      id: `${index + 1}`,
      name: displayName,
      code: `${displayName.substring(0, 3).toUpperCase()}`,
      country: displayName,
      totalOI: latestDataPoint.absoluteHashRate * 1000000, // 转换为更大的数值显示
      totalOIPercentage: latestDataPoint.percentage,
      // 以下字段保持模拟数据，因为CSV中没有这些信息
      spread: Math.random() * 0.3,
      fundingRate: (Math.random() - 0.5) * 0.05,
      volume: latestDataPoint.absoluteHashRate * 2000000,
      priceChange24h: (Math.random() - 0.5) * 8,
      priceHistory: priceHistory.length > 24 ? priceHistory.slice(-24) : priceHistory
    };
  });
  
  return regions;
};

// 立即初始化数据
initializeData()
  .then(() => {
    console.log('数据验证：');
    console.log(`- 找到 ${Object.keys(allCountryData).length} 个国家`);
    if (Object.keys(allCountryData).length > 0) {
      const sampleCountry = Object.keys(allCountryData)[0];
      console.log(`- 样例国家 "${sampleCountry}" 有 ${allCountryData[sampleCountry].length} 个数据点`);
      console.log(`- 第一个数据点:`, allCountryData[sampleCountry][0]);
    }
    
    console.log(`- 找到 ${countryRegions.length} 个区域`);
    if (countryRegions.length > 0) {
      console.log(`- 第一个区域:`, {
        id: countryRegions[0].id,
        name: countryRegions[0].name,
        totalOI: countryRegions[0].totalOI,
        totalOIPercentage: countryRegions[0].totalOIPercentage
      });
    }
  })
  .catch(console.error);

// 导出处理后的国家数据（用于展示列表）
export { allCountryData, countryRegions }; 