import React, { useState, useEffect } from 'react';
import { Typography, Tabs, Form, Input, Button, InputNumber, Select, message, Alert, Card, List, Empty, Modal, Popconfirm, Row, Col, Spin, Tooltip, Tag, Radio } from 'antd';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { useTranslation } from 'react-i18next';
import { CreateAdSpaceParams, UserRole, RegisterGameDevParams, RemoveGameDevParams, AdSpace, BillboardNFT } from '../types';
import { createAdSpaceTx, registerGameDevTx, removeGameDevTx, getCreatedAdSpaces, updateAdSpacePriceTx, deleteAdSpaceTx, getAdSpaceById, getNFTDetails } from '../utils/contract';
import { CONTRACT_CONFIG, NETWORKS, DEFAULT_NETWORK } from '../config/config';
import { useWalletTransaction } from '../hooks/useWalletTransaction';
import './Manage.scss';
import { ReloadOutlined, PlusOutlined, AppstoreOutlined, DollarOutlined, DeleteOutlined, FormOutlined, UserAddOutlined, UserDeleteOutlined, TeamOutlined, ColumnWidthOutlined, LinkOutlined, SettingOutlined, BankOutlined } from '@ant-design/icons';
import AdSpaceItem from '../components/adSpace/AdSpaceItem';

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;

// 粒子背景组件
const ParticlesBackground = () => (
  <div className="particles-background">
    <div className="particles"></div>
  </div>
);

const ManagePage: React.FC = () => {
  const { t } = useTranslation();
  const [adSpaceForm] = Form.useForm();
  const [devRegisterForm] = Form.useForm();
  const [platformRatioForm] = Form.useForm();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(UserRole.USER);
  const [registeredDevs, setRegisteredDevs] = useState<string[]>([]);
  const [activeKey, setActiveKey] = useState<string>("create");
  const [myAdSpaces, setMyAdSpaces] = useState<AdSpace[]>([]);
  const [loadingAdSpaces, setLoadingAdSpaces] = useState<boolean>(false);
  const [priceModalVisible, setPriceModalVisible] = useState<boolean>(false);
  const [currentAdSpace, setCurrentAdSpace] = useState<AdSpace | null>(null);
  const [newPrice, setNewPrice] = useState<number | null>(null);
  const [priceUpdateLoading, setPriceUpdateLoading] = useState<boolean>(false);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const [currentPlatformRatio, setCurrentPlatformRatio] = useState<number>(10); // 默认平台分成比例为10%
  const [platformRatioLoading, setPlatformRatioLoading] = useState<boolean>(false);

  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const { executeTransaction } = useWalletTransaction();

  // 获取适合当前网络的 explorer URL
  const getExplorerUrl = (type: 'address' | 'object', id: string): string => {
    // 根据当前网络配置选择正确的浏览器链接
    let baseUrl = '';

    if (DEFAULT_NETWORK === 'mainnet') {
      baseUrl = NETWORKS.mainnet.explorerUrl;
    } else {
      // 默认使用testnet
      baseUrl = NETWORKS.testnet.explorerUrl;
    }

    if (type === 'address') {
      return `${baseUrl}/address/${id}`;
    } else {
      return `${baseUrl}/object/${id}`;
    }
  };

  // 检查用户角色
  useEffect(() => {
    const checkUserRole = async () => {
      if (!account) return;

      try {
        // 导入auth.ts中的checkUserRole函数
        const { checkUserRole } = await import('../utils/auth');

        // 使用SuiClient和用户地址检查用户角色
        const role = await checkUserRole(account.address, suiClient);
        console.log('当前用户角色:', role);
        setUserRole(role);

        // 设置默认标签页: 管理员显示开发者管理, 开发者显示创建广告位
        if (role === UserRole.ADMIN) {
          setActiveKey("platformManage");
          const { getGameDevsFromFactory, getPlatformRatio } = await import('../utils/contract');
          // 获取已注册开发者
          const devs = await getGameDevsFromFactory(CONTRACT_CONFIG.FACTORY_OBJECT_ID);
          setRegisteredDevs(devs);

          // 获取当前平台分成比例
          try {
            const ratio = await getPlatformRatio(CONTRACT_CONFIG.FACTORY_OBJECT_ID);
            setCurrentPlatformRatio(ratio);
            platformRatioForm.setFieldsValue({ ratio });
          } catch (err) {
            console.error('获取平台分成比例失败:', err);
          }
        } else if (role === UserRole.GAME_DEV) {
          setActiveKey("create");
          loadMyAdSpaces();
        }
      } catch (err) {
        console.error('检查用户角色失败:', err);
        message.error('检查用户角色失败');
      }
    };

    checkUserRole();
  }, [account, suiClient]);

  // 监听activeKey变化，当显示"我的广告位"标签时自动加载数据
  useEffect(() => {
    if (activeKey === 'myAdSpaces' && account && userRole === UserRole.GAME_DEV) {
      message.loading({ content: t('manage.myAdSpaces.loadingData'), key: 'loadAdSpaces', duration: 0 });
      loadMyAdSpaces()
        .then(() => {
          message.success({ content: t('manage.myAdSpaces.loadSuccess'), key: 'loadAdSpaces', duration: 2 });
        })
        .catch((error) => {
          console.error('加载广告位数据失败:', error);
          message.error({ content: t('manage.myAdSpaces.loadFailed'), key: 'loadAdSpaces', duration: 2 });
        });
    }
  }, [activeKey, account, userRole, t]);

  // 加载开发者创建的广告位
  const loadMyAdSpaces = async () => {
    if (!account) {
      console.log('无法加载广告位：账户未连接');
      return;
    }

    try {
      setLoadingAdSpaces(true);
      console.log('开始加载开发者创建的广告位，开发者地址:', account.address);

      // 先检查是否为游戏开发者
      const { checkIsGameDev } = await import('../utils/auth');
      const isGameDev = await checkIsGameDev(account.address);
      console.log('游戏开发者验证结果:', isGameDev);

      if (!isGameDev) {
        console.warn('当前用户不是游戏开发者，无法加载广告位');
        message.warning(t('manage.myAdSpaces.notGameDev'));
        setMyAdSpaces([]);
        return;
      }

      // 加载广告位前，清空当前缓存的广告位数据
      setMyAdSpaces([]);

      // 禁用缓存，直接从区块链获取最新数据
      console.log('正在从区块链获取最新广告位数据...');
      const { getCreatedAdSpaces } = await import('../utils/contract');

      // 记录获取广告位的时间
      const startTime = new Date().getTime();
      const adSpaces = await getCreatedAdSpaces(account.address);
      const endTime = new Date().getTime();
      console.log(`成功加载广告位数据 (耗时: ${endTime - startTime}ms):`, adSpaces);

      // 过滤掉示例广告位数据
      const realAdSpaces = adSpaces.filter(adSpace => !adSpace.isExample);
      console.log('过滤后的实际广告位数据:', realAdSpaces);

      if (realAdSpaces.length > 0) {
        // 有真实广告位数据时，显示真实数据
        setMyAdSpaces(realAdSpaces);
      } else if (adSpaces.length > 0 && adSpaces.some(ad => ad.isExample)) {
        // 只有示例数据时，也显示示例数据来指导用户
        setMyAdSpaces(adSpaces);
      } else {
        // 无数据时，显示空状态
        setMyAdSpaces([]);
      }
    } catch (err) {
      console.error('获取开发者广告位失败:', err);
      message.error(t('manage.myAdSpaces.loadFailed'));
      setMyAdSpaces([]);
    } finally {
      setLoadingAdSpaces(false);
    }
  };

  // 创建广告位表单提交
  const handleCreateAdSpace = async (values: any) => {
    try {
      setLoading(true);
      setError(null);

      console.log('创建广告位，输入参数:', values);

      // 验证必填字段
      if (!values.gameId || !values.location || !values.price) {
        throw new Error(t('manage.createAdSpace.form.allFieldsRequired'));
      }

      // 获取尺寸值
      let sizeFormat = '';
      if (values.sizeType === 'standard') {
        // 验证标准比例
        if (!values.size) {
          throw new Error(t('manage.createAdSpace.form.dimensionRequired'));
        }
        sizeFormat = values.size; // 直接使用选择的标准比例
      } else {
        // 构建自定义比例字符串
        const width = values.customSize?.width;
        const height = values.customSize?.height;
        if (!width || !height) {
          throw new Error(t('manage.createAdSpace.form.invalidCustomDimension'));
        }
        sizeFormat = `${width}:${height}`;
      }

      // 价格验证 - 确保价格大于0
      if (Number(values.price) <= 0) {
        throw new Error(t('manage.createAdSpace.form.priceGreaterThanZero'));
      }

      // 将价格转换为整数（以MIST为单位，1 SUI = 10^9 MIST）
      // 使用字符串方法处理小数，避免浮点数精度问题
      const priceFloat = parseFloat(values.price);
      const priceInMist = Math.floor(priceFloat * 1000000000).toString();

      console.log('转换后的价格(MIST):', priceInMist);

      // 检查合约配置
      if (!CONTRACT_CONFIG.FACTORY_OBJECT_ID || !CONTRACT_CONFIG.PACKAGE_ID || !CONTRACT_CONFIG.MODULE_NAME || !CONTRACT_CONFIG.CLOCK_ID) {
        console.error('合约配置不完整:', CONTRACT_CONFIG);
        throw new Error(t('manage.createAdSpace.errors.contractConfigIncomplete'));
      }

      const params: CreateAdSpaceParams = {
        factoryId: CONTRACT_CONFIG.FACTORY_OBJECT_ID,
        gameId: values.gameId,
        location: values.location,
        size: sizeFormat, // 使用转换后的尺寸格式
        price: priceInMist,
        clockId: CONTRACT_CONFIG.CLOCK_ID
      };

      console.log('准备创建广告位，参数:', params);

      // 在创建交易前，先获取当前用户的广告位数量
      let currentAdSpaces = [];
      if (account) {
        currentAdSpaces = await getCreatedAdSpaces(account.address);
        currentAdSpaces = currentAdSpaces.filter(adSpace => !adSpace.isExample);
      }
      const currentAdSpaceCount = currentAdSpaces.length;
      console.log('创建前广告位数量:', currentAdSpaceCount);

      // 创建交易
      const txb = createAdSpaceTx(params);

      console.log('交易创建成功，准备执行');

      // 显示交易执行中状态
      message.loading({ content: t('manage.createAdSpace.loading'), key: 'createAdSpace', duration: 0 });

      // 执行交易
      const { success: txSuccess } = await executeTransaction(txb, {
        loadingMessage: t('manage.createAdSpace.loading'),
        successMessage: t('manage.createAdSpace.form.txSubmitted'),
        loadingKey: 'createAdSpace',
        successKey: 'createAdSpace',
        userRejectedMessage: t('common.messages.userRejected')
      });

      // 如果交易被用户拒绝或失败，直接返回
      if (!txSuccess) {
        return;
      }

      console.log('交易执行成功，已提交到区块链');

      // 交易已提交，显示等待确认消息
      message.loading({ content: t('manage.createAdSpace.form.waitingConfirmation'), key: 'confirmAdSpace', duration: 0 });

      // 使用轮询方式检查交易结果，最多尝试5次
      let attempts = 0;
      const maxAttempts = 5;
      let confirmSuccess = false;

      console.log(`等待广告位数量增加，确认交易成功...`);

      while (attempts < maxAttempts && !confirmSuccess) {
        attempts++;
        // 延迟时间随尝试次数增加
        const delay = 2000 * attempts;
        console.log(`尝试第 ${attempts}/${maxAttempts} 次获取广告位数据，等待 ${delay}ms...`);

        // 等待一段时间再获取数据，确保链上数据已更新
        await new Promise(resolve => setTimeout(resolve, delay));

        try {
          // 确保account存在
          if (!account) {
            console.error('执行期间账户状态发生变化');
            break;
          }

          // 直接从合约获取最新数据
          const latestAdSpaces = await getCreatedAdSpaces(account.address);
          const newAdSpaces = latestAdSpaces.filter(adSpace => !adSpace.isExample);
          const newAdSpaceCount = newAdSpaces.length;

          console.log('当前广告位数量:', newAdSpaceCount, '原广告位数量:', currentAdSpaceCount);

          // 判断广告位数量是否增加
          if (newAdSpaceCount > currentAdSpaceCount) {
            confirmSuccess = true;
            console.log('广告位数量增加，创建成功');

            // 成功找到后，更新React状态，保存最新数据
            setMyAdSpaces(newAdSpaces);

            // 显示成功确认消息
            message.success({
              content: t('manage.createAdSpace.success'),
              key: 'confirmAdSpace',
              duration: 2
            });

            // 重置表单
            adSpaceForm.resetFields();

            // 关闭创建模态框
            // TODO: 如果有创建模态框，在此处关闭

            // 切换到广告位展示页面
            setActiveKey('myAdSpaces');
          } else {
            console.log('广告位数量未增加，继续轮询');
          }
        } catch (error) {
          console.error(`第 ${attempts} 次获取广告位数据失败:`, error);
        }
      }

      // 如果多次尝试后仍未找到，显示提示信息
      if (!confirmSuccess) {
        message.info({
          content: t('manage.createAdSpace.form.delayedDisplay'),
          key: 'confirmAdSpace',
          duration: 4
        });

        // 切换到广告位展示页面并尝试重新加载
        setActiveKey('myAdSpaces');
        loadMyAdSpaces();
      }
    } catch (err) {
      console.error('创建广告位失败:', err);
      const errorMsg = err instanceof Error ? err.message : String(err);

      // 检查特定错误类型并提供更具体的错误信息
      if (errorMsg.includes('ENotGameDev')) {
        setError(t('manage.createAdSpace.form.errors.notGameDev'));
      } else if (errorMsg.includes('InsufficientGas')) {
        setError(t('manage.createAdSpace.form.errors.insufficientGas'));
      } else if (errorMsg.includes('InvalidParams') || errorMsg.includes('Invalid params')) {
        setError(t('manage.createAdSpace.form.errors.invalidParams'));
      } else {
        setError(`${t('manage.createAdSpace.form.errors.createFailed')}: ${errorMsg}`);
      }

      message.error({ content: t('manage.createAdSpace.form.errors.createFailed'), key: 'createAdSpace', duration: 2 });
    } finally {
      setLoading(false);
    }
  };

  // 处理标签页切换
  const handleTabChange = (key: string) => {
    setActiveKey(key);
    // useEffect会自动处理当切换到'myAdSpaces'标签时的数据加载
  };

  // 注册游戏开发者
  const handleRegisterGameDev = async (values: any) => {
    try {
      setLoading(true);
      setError(null);

      // 规范化地址格式，确保统一格式用于比较
      const normalizedAddress = values.devAddress.toLowerCase();

      // 验证地址格式
      if (!normalizedAddress.startsWith('0x') || normalizedAddress.length !== 66) {
        setError(t('manage.platformManage.registerDev.invalidAddress'));
        setLoading(false);
        return;
      }

      // 检查开发者是否已经注册
      const isDevAlreadyRegistered = registeredDevs.some(
        dev => dev.toLowerCase() === normalizedAddress
      );

      if (isDevAlreadyRegistered) {
        setError(t('manage.platformManage.registerDev.alreadyRegistered'));
        setLoading(false);
        return;
      }

      // 创建交易
      const params: RegisterGameDevParams = {
        factoryId: CONTRACT_CONFIG.FACTORY_OBJECT_ID,
        developer: normalizedAddress
      };

      const txb = registerGameDevTx(params);

      // 执行交易
      const { success } = await executeTransaction(txb, {
        loadingMessage: t('manage.platformManage.registerDev.executing'),
        successMessage: t('manage.platformManage.registerDev.success'),
        loadingKey: 'registerDev',
        successKey: 'registerDev',
        userRejectedMessage: t('manage.platformManage.registerDev.userRejected'),
        onSuccess: async (result) => {
          console.log('交易执行成功:', result);

          // 重置表单
          devRegisterForm.resetFields();

          // 显示刷新状态
          message.loading({
            content: t('manage.platformManage.registerDev.refreshing'),
            key: 'refreshDevs',
            duration: 0 // 不自动关闭
          });

          try {
            // 获取最新的开发者列表
            const { getGameDevsFromFactory } = await import('../utils/contract');

            // 尝试最多3次获取最新列表，每次间隔增加
            let updatedDevs: string[] = [];
            let attempts = 0;
            const maxAttempts = 3;
            let confirmSuccess = false;

            while (attempts < maxAttempts && !confirmSuccess) {
              attempts++;
              // 等待时间随尝试次数增加
              const delay = 2000 * attempts;
              console.log(`等待开发者列表更新，尝试 ${attempts}/${maxAttempts}，等待 ${delay}ms...`);

              // 等待一段时间再获取数据，确保链上数据已更新
              await new Promise(resolve => setTimeout(resolve, delay));

              try {
                updatedDevs = await getGameDevsFromFactory(CONTRACT_CONFIG.FACTORY_OBJECT_ID);

                // 检查新地址是否在列表中
                if (updatedDevs.some(dev => dev.toLowerCase() === normalizedAddress)) {
                  confirmSuccess = true;
                  console.log(`成功获取更新的开发者列表，尝试次数: ${attempts}`);

                  // 更新状态
                  setRegisteredDevs(updatedDevs);

                  // 显示成功消息
                  message.success({
                    content: t('manage.platformManage.registeredDevs.listUpdated'),
                    key: 'refreshDevs',
                    duration: 2
                  });
                } else {
                  console.log(`开发者地址未出现在列表中，等待更长时间，尝试次数: ${attempts}`);
                }
              } catch (error) {
                console.error(`尝试第 ${attempts} 次获取开发者列表失败:`, error);
              }
            }

            if (!confirmSuccess) {
              // 多次尝试后仍未获取到最新列表，不更新UI
              console.warn('无法从区块链获取最新数据，不更新UI');
              message.warning({
                content: t('manage.platformManage.registeredDevs.updateUnconfirmed'),
                key: 'refreshDevs',
                duration: 3
              });
            }
          } catch (fetchError) {
            console.error('更新开发者列表失败:', fetchError);
            // 交易已成功但获取列表失败，不更新UI
            message.warning({
              content: t('manage.platformManage.registeredDevs.updateUnconfirmed'),
              key: 'refreshDevs',
              duration: 3
            });
          }
        },
        onError: (error) => {
          console.error('交易执行失败:', error);
          const errorMsg = error instanceof Error ? error.message : String(error);
          setError(`交易执行失败: ${errorMsg}`);
        }
      });

      if (!success) {
        // 交易失败，但用户拒绝的情况已在executeTransaction中处理
        return;
      }
    } catch (err) {
      console.error('注册游戏开发者失败:', err);
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(`注册游戏开发者失败: ${errorMsg}`);
      message.error({
        content: '游戏开发者注册失败',
        key: 'registerDev',
        duration: 2
      });
    } finally {
      setLoading(false);
    }
  };

  // 移除游戏开发者
  const handleRemoveGameDev = async (developerAddress: string) => {
    try {
      setLoading(true);
      setError(null);

      // 规范化地址格式
      const normalizedAddress = developerAddress.toLowerCase();

      // 确认开发者存在于列表中
      if (!registeredDevs.some(dev => dev.toLowerCase() === normalizedAddress)) {
        setError(t('manage.platformManage.registeredDevs.notInList'));
        setLoading(false);
        return;
      }

      // 创建交易参数
      const params: RemoveGameDevParams = {
        factoryId: CONTRACT_CONFIG.FACTORY_OBJECT_ID,
        developer: normalizedAddress
      };

      // 创建交易
      const txb = removeGameDevTx(params);

      // 执行交易
      const { success } = await executeTransaction(txb, {
        loadingMessage: t('manage.platformManage.registeredDevs.removing'),
        successMessage: t('manage.platformManage.registeredDevs.removeSuccess'),
        loadingKey: 'removeDev',
        successKey: 'removeDev',
        userRejectedMessage: t('manage.platformManage.registeredDevs.userRejected'),
        onSuccess: async (result) => {
          console.log('移除开发者交易执行成功:', result);

          // 显示刷新状态
          message.loading({
            content: t('manage.platformManage.registeredDevs.refreshing'),
            key: 'refreshDevs',
            duration: 0 // 不自动关闭
          });

          try {
            // 获取最新的开发者列表
            const { getGameDevsFromFactory } = await import('../utils/contract');

            // 尝试最多3次获取最新列表，每次间隔增加
            let updatedDevs: string[] = [];
            let attempts = 0;
            const maxAttempts = 3;
            let confirmSuccess = false;

            while (attempts < maxAttempts && !confirmSuccess) {
              attempts++;
              // 等待时间随尝试次数增加
              const delay = 2000 * attempts;
              console.log(`等待开发者列表更新，尝试 ${attempts}/${maxAttempts}，等待 ${delay}ms...`);

              // 等待一段时间再获取数据，确保链上数据已更新
              await new Promise(resolve => setTimeout(resolve, delay));

              try {
                updatedDevs = await getGameDevsFromFactory(CONTRACT_CONFIG.FACTORY_OBJECT_ID);

                // 检查开发者地址是否已从列表中移除
                if (!updatedDevs.some(dev => dev.toLowerCase() === normalizedAddress)) {
                  confirmSuccess = true;
                  console.log(`成功获取更新的开发者列表，已确认开发者被移除，尝试次数: ${attempts}`);

                  // 更新状态
                  setRegisteredDevs(updatedDevs);

                  // 显示成功消息
                  message.success({
                    content: t('manage.platformManage.registeredDevs.listUpdated'),
                    key: 'refreshDevs',
                    duration: 2
                  });
                } else {
                  console.log(`开发者地址仍在列表中，等待更长时间，尝试次数: ${attempts}`);
                }
              } catch (error) {
                console.error(`尝试第 ${attempts} 次获取开发者列表失败:`, error);
              }
            }

            if (!confirmSuccess) {
              // 多次尝试后仍未获取到最新列表，不更新UI
              console.warn('无法从区块链获取最新数据，不更新UI');
              message.warning({
                content: t('manage.platformManage.registeredDevs.updateUnconfirmed'),
                key: 'refreshDevs',
                duration: 3
              });
            }
          } catch (fetchError) {
            console.error('更新开发者列表失败:', fetchError);
            // 交易已成功但获取列表失败，不更新UI
            message.warning({
              content: t('manage.platformManage.registeredDevs.updateUnconfirmed'),
              key: 'refreshDevs',
              duration: 3
            });
          }
        },
        onError: (error) => {
          console.error('移除开发者交易执行失败:', error);
          const errorMsg = error instanceof Error ? error.message : String(error);
          setError(`${t('manage.platformManage.registeredDevs.removeFailed')}: ${errorMsg}`);
        }
      });

      if (!success) {
        // 交易失败，但用户拒绝的情况已在executeTransaction中处理
        return;
      }
    } catch (err) {
      console.error('移除游戏开发者失败:', err);
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(`${t('manage.platformManage.registeredDevs.removeFailed')}: ${errorMsg}`);
      message.error({
        content: t('manage.platformManage.registeredDevs.removeFailed'),
        key: 'removeDev',
        duration: 2
      });
    } finally {
      setLoading(false);
    }
  };

  // 处理调价的模态框
  const handleUpdatePrice = (adSpace: AdSpace) => {
    setCurrentAdSpace(adSpace);
    // 将价格从MIST转换为SUI
    setNewPrice(Number(adSpace.price) / 1000000000);
    setPriceModalVisible(true);
  };

  // 提交调价
  const handlePriceUpdateSubmit = async () => {
    if (!currentAdSpace || newPrice === null || newPrice <= 0) {
      message.error(t('manage.myAdSpaces.invalidPrice'));
      return;
    }

    try {
      setPriceUpdateLoading(true);
      setError(null);

      // 转换为MIST，使用字符串方法处理小数，避免浮点数精度问题
      const priceInMist = Math.floor(newPrice * 1000000000).toString();

      // 构建交易
      const txb = updateAdSpacePriceTx({
        adSpaceId: currentAdSpace.id,
        price: priceInMist
      });

      // 显示交易执行中状态
      message.loading({ content: t('manage.buttons.updatePrice'), key: 'updatePrice', duration: 0 });

      // 执行交易
      const { success: txSuccess } = await executeTransaction(txb, {
        loadingMessage: t('manage.buttons.updatePrice'),
        successMessage: t('manage.priceModal.priceUpdateSuccess'),
        loadingKey: 'updatePrice',
        successKey: 'updatePrice',
        userRejectedMessage: t('common.messages.userRejected')
      });

      // 如果交易被用户拒绝或失败，直接返回
      if (!txSuccess) {
        return;
      }

      // 交易已提交
      message.loading({ content: t('manage.buttons.waitingConfirmation'), key: 'updatePrice', duration: 0 });

      // 使用轮询方式检查交易结果，最多尝试5次
      let attempts = 0;
      const maxAttempts = 5;
      let success = false;

      while (attempts < maxAttempts && !success) {
        attempts++;
        // 增加等待时间
        const delay = 2000 * attempts;
        console.log(`等待交易确认，尝试 ${attempts}/${maxAttempts}，等待 ${delay}ms...`);

        // 等待一段时间再检查
        await new Promise(resolve => setTimeout(resolve, delay));

        try {
          // 尝试从区块链获取最新的广告位数据
          const latestAdSpace = await getAdSpaceById(currentAdSpace.id);

          // 检查价格是否已更新
          if (latestAdSpace && Number(latestAdSpace.price) === Number(priceInMist)) {
            success = true;
            console.log('价格更新已成功确认');
          } else {
            console.log('价格尚未更新，继续等待...');
          }
        } catch (err) {
          console.warn(`检查交易结果时出错 (尝试 ${attempts}): `, err);
        }
      }

      // 无论是否成功确认，都显示成功消息（交易已提交到链上）
      message.success({ content: t('manage.priceModal.priceUpdateSuccess'), key: 'updatePrice', duration: 2 });

      // 关闭模态框
      setPriceModalVisible(false);

      // 刷新广告位列表
      try {
        console.log('开始刷新广告位列表');
        await loadMyAdSpaces();
        console.log('广告位列表刷新成功');
      } catch (err) {
        console.error('刷新广告位列表失败:', err);
        message.error(t('manage.myAdSpaces.refreshFailed'));
      }
    } catch (err) {
      console.error('更新价格失败:', err);
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(`更新价格失败: ${errorMsg}`);
      message.error({ content: t('manage.myAdSpaces.priceUpdateFailed'), key: 'updatePrice', duration: 2 });
    } finally {
      setPriceUpdateLoading(false);
    }
  };

  // 处理删除广告位
  const handleDeleteAdSpace = async (adSpaceId: string) => {
    try {
      setDeleteLoading(true);
      setError(null);

      // 构建交易
      const txb = deleteAdSpaceTx({
        factoryId: CONTRACT_CONFIG.FACTORY_OBJECT_ID,
        adSpaceId
      });

      // 显示交易执行中状态
      message.loading({ content: t('manage.buttons.deleteAdSpace'), key: 'deleteAdSpace', duration: 0 });

      // 执行交易
      const { success: txSuccess } = await executeTransaction(txb, {
        loadingMessage: t('manage.buttons.deleteAdSpace'),
        successMessage: t('manage.buttons.deleteSuccess'),
        loadingKey: 'deleteAdSpace',
        successKey: 'deleteAdSpace',
        userRejectedMessage: t('common.messages.userRejected')
      });

      // 如果交易被用户拒绝或失败，直接返回
      if (!txSuccess) {
        return;
      }

      // 交易已提交
      message.loading({ content: t('manage.buttons.waitingConfirmation'), key: 'deleteAdSpace', duration: 0 });

      // 使用轮询方式检查交易结果，最多尝试5次
      let attempts = 0;
      const maxAttempts = 5;
      let success = false;

      while (attempts < maxAttempts && !success) {
        attempts++;
        // 增加等待时间
        const delay = 2000 * attempts;
        console.log(`等待删除确认，尝试 ${attempts}/${maxAttempts}，等待 ${delay}ms...`);

        // 等待一段时间再检查
        await new Promise(resolve => setTimeout(resolve, delay));

        try {
          // 尝试从区块链获取广告位数据
          // 如果广告位已删除，应该返回null
          const latestAdSpace = await getAdSpaceById(adSpaceId);

          if (!latestAdSpace) {
            success = true;
            console.log('广告位删除已成功确认');
          } else {
            console.log('广告位尚未删除，继续等待...');
          }
        } catch (err) {
          // 如果返回404错误，也表示广告位已被删除
          console.warn(`检查交易结果时出错 (尝试 ${attempts}): `, err);
          if (String(err).includes('not found') || String(err).includes('404')) {
            success = true;
            console.log('通过错误确认广告位已删除');
          }
        }
      }

      // 显示成功消息
      message.success({ content: t('manage.myAdSpaces.deleteSuccess'), key: 'deleteAdSpace', duration: 2 });

      // 刷新广告位列表
      try {
        console.log('开始刷新广告位列表');
        await loadMyAdSpaces();
        console.log('广告位列表刷新成功');
      } catch (err) {
        console.error('刷新广告位列表失败:', err);
        message.error(t('manage.myAdSpaces.refreshFailed'));
      }
    } catch (err) {
      console.error('删除广告位失败:', err);
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(`${t('manage.myAdSpaces.deleteFailed')}: ${errorMsg}`);
      message.error({ content: t('manage.myAdSpaces.deleteFailed'), key: 'deleteAdSpace', duration: 2 });
    } finally {
      setDeleteLoading(false);
    }
  };

  // 渲染空广告位状态
  const renderEmptyAdSpaces = () => (
    <div className="empty-container" style={{ textAlign: 'center', padding: '40px 20px', background: '#f9f9f9', borderRadius: '8px' }}>
      <AppstoreOutlined style={{ fontSize: '48px', color: '#4e63ff', marginBottom: '16px' }} />
      <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>{t('manage.myAdSpaces.empty')}</div>
      <div style={{ color: 'rgba(0, 0, 0, 0.45)', marginBottom: '24px' }}>{t('manage.myAdSpaces.emptyDesc')}</div>
      <Button
        type="primary"
        size="large"
        className="create-button"
        onClick={() => setActiveKey('create')}
        icon={<PlusOutlined />}
      >
        {t('manage.tabs.createAdSpace')}
      </Button>
    </div>
  );

  // 渲染我的广告位列表
  const renderMyAdSpaces = () => {
    if (loadingAdSpaces) {
      return (
        <div className="loading-container">
          <Spin size="large" />
          <p>{t('manage.myAdSpaces.loading')}</p>
        </div>
      );
    }

    if (myAdSpaces.length === 0) {
      return renderEmptyAdSpaces();
    }

    return (
      <Row gutter={[24, 24]} className="ad-spaces-grid">
        {myAdSpaces.map((adSpace) => (
          <AdSpaceItem
            key={adSpace.id}
            adSpace={adSpace}
            onUpdatePrice={handleUpdatePrice}
            onDeleteAdSpace={handleDeleteAdSpace}
            deleteLoading={deleteLoading}
          />
        ))}
      </Row>
    );
  };

  // 渲染已注册开发者列表
  const renderRegisteredDevs = () => {
    if (registeredDevs.length === 0) {
      return <Empty description={t('manage.platformManage.registeredDevs.empty')} />;
    }

    return (
      <List
        className="registered-devs-list"
        itemLayout="horizontal"
        dataSource={registeredDevs}
        size="small"
        bordered={false}
        renderItem={(item) => (
          <List.Item className="dev-address-item" style={{ padding: '12px 0' }}>
            <div className="address-content" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <Text
                className="address-text"
                copyable={{ tooltips: [t('common.buttons.copy'), t('common.buttons.copied')] }}
                onClick={() => window.open(getExplorerUrl('address', item), '_blank')}
                style={{ cursor: 'pointer', fontFamily: 'monospace', fontSize: '13px' }}
                ellipsis={{ tooltip: item }}
              >
                {item}
              </Text>
              <div className="button-group" style={{ display: 'flex', gap: '8px' }}>
                <Tooltip title={t('common.buttons.viewInExplorer')}>
                  <Button
                    size="small"
                    type="primary"
                    icon={<LinkOutlined />}
                    onClick={() => window.open(getExplorerUrl('address', item), '_blank')}
                  >
                    {t('manage.platformManage.factoryInfo.view')}
                  </Button>
                </Tooltip>
                <Popconfirm
                  title={t('manage.platformManage.registeredDevs.removeConfirmTitle')}
                  description={t('manage.platformManage.registeredDevs.removeConfirmDesc')}
                  onConfirm={() => handleRemoveGameDev(item)}
                  okText={t('common.buttons.confirm')}
                  cancelText={t('common.buttons.cancel')}
                >
                  <Button
                    size="small"
                    danger
                    icon={<UserDeleteOutlined />}
                  >
                    {t('manage.platformManage.registeredDevs.removeButton')}
                  </Button>
                </Popconfirm>
              </div>
            </div>
          </List.Item>
        )}
      />
    );
  };

  // 处理更新平台分成比例
  const handleUpdatePlatformRatio = async (values: { ratio: number }) => {
    try {
      setPlatformRatioLoading(true);
      setError(null);

      // 验证比例在有效范围内 (0-100)
      const ratio = values.ratio;
      if (ratio < 0 || ratio > 100) {
        setError(t('manage.platformManage.platformRatio.rangeError'));
        setPlatformRatioLoading(false);
        return;
      }

      // 构建交易参数
      const params = {
        factoryId: CONTRACT_CONFIG.FACTORY_OBJECT_ID,
        ratio
      };

      // 导入更新平台分成比例的函数
      const { updatePlatformRatioTx, getPlatformRatio } = await import('../utils/contract');
      // 创建交易
      const txb = updatePlatformRatioTx(params);

      // 执行交易
      const { success } = await executeTransaction(txb, {
        loadingMessage: t('manage.platformManage.platformRatio.updating'),
        successMessage: t('manage.platformManage.platformRatio.updateSuccess'),
        loadingKey: 'updateRatio',
        successKey: 'updateRatio',
        userRejectedMessage: t('manage.platformManage.platformRatio.userRejected'),
        onSuccess: async (result) => {
          console.log('更新平台分成比例交易已提交:', result);

          // 显示交易已提交消息
          message.loading({
            content: t('manage.platformManage.platformRatio.waitingConfirmation'),
            key: 'updateRatio',
            duration: 0 // 不自动关闭
          });

          // 使用轮询方式检查交易结果，最多尝试3次
          let attempts = 0;
          const maxAttempts = 3;
          let confirmSuccess = false;

          while (attempts < maxAttempts && !confirmSuccess) {
            attempts++;
            // 等待时间随尝试次数增加
            const delay = 2000 * attempts;
            console.log(`等待平台分成比例更新确认，尝试 ${attempts}/${maxAttempts}，等待 ${delay}ms...`);

            // 等待一段时间再获取数据，确保链上数据已更新
            await new Promise(resolve => setTimeout(resolve, delay));

            try {
              // 从区块链获取最新的平台分成比例
              const updatedRatio = await getPlatformRatio(CONTRACT_CONFIG.FACTORY_OBJECT_ID);
              console.log('获取到的最新平台分成比例:', updatedRatio);

              // 检查比例是否已更新
              if (updatedRatio === ratio) {
                confirmSuccess = true;
                console.log('平台分成比例更新已确认');

                // 更新状态
                setCurrentPlatformRatio(updatedRatio);

                // 显示成功消息
                message.success({
                  content: t('manage.platformManage.platformRatio.updateSuccess'),
                  key: 'updateRatio',
                  duration: 2
                });
              } else {
                console.log(`平台分成比例尚未更新，当前值: ${updatedRatio}，期望值: ${ratio}`);
              }
            } catch (error) {
              console.error(`尝试第 ${attempts} 次获取平台分成比例失败:`, error);
            }
          }

          // 如果多次尝试后仍未确认更新，显示提示但不更新UI
          if (!confirmSuccess) {
            console.warn('无法从区块链确认平台分成比例更新，不更新UI');
            message.warning({
              content: t('manage.platformManage.platformRatio.updateUnconfirmed'),
              key: 'updateRatio',
              duration: 3
            });
          }
        },
        onError: (error) => {
          console.error('更新平台分成比例交易执行失败:', error);
          const errorMsg = error instanceof Error ? error.message : String(error);
          setError(`${t('manage.platformManage.platformRatio.updateFailed')}: ${errorMsg}`);
        }
      });

      if (!success) {
        // 交易失败，但用户拒绝的情况已在executeTransaction中处理
        return;
      }
    } catch (err) {
      console.error('更新平台分成比例失败:', err);
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(`${t('manage.platformManage.platformRatio.updateFailed')}: ${errorMsg}`);
      message.error({
        content: t('manage.platformManage.platformRatio.updateFailed'),
        key: 'updateRatio',
        duration: 2
      });
    } finally {
      setPlatformRatioLoading(false);
    }
  };

  // 如果未连接钱包，显示提示
  if (!account) {
    return (
      <div className="manage-page">
        <ParticlesBackground />
        <div className="section-title">
          <Title level={2}>{t('manage.title')}</Title>
          <Paragraph>{t('manage.subtitle')}</Paragraph>
        </div>

        <div className="connect-wallet-prompt">
          <Alert
            message={t('myNFTs.connectWallet.title')}
            description={t('myNFTs.connectWallet.description')}
            type="info"
            showIcon
          />
        </div>
      </div>
    );
  }

  // 如果用户不是游戏开发者或管理员，显示无权限提示
  if (userRole !== UserRole.GAME_DEV && userRole !== UserRole.ADMIN) {
    return (
      <div className="manage-page">
        <ParticlesBackground />
        <div className="section-title">
          <Title level={2}>{t('manage.title')}</Title>
          <Paragraph>{t('manage.subtitle')}</Paragraph>
        </div>

        <div className="connect-wallet-prompt">
          <Alert
            message={t('manage.errors.accessDenied')}
            description={t('manage.errors.accessDeniedDesc')}
            type="warning"
            showIcon
          />
        </div>
      </div>
    );
  }

  return (
    <div className="manage-page">
      <ParticlesBackground />
      <div className="section-title">
        <Title level={2}>{t('manage.title')}</Title>
        <Paragraph>{t('manage.subtitle')}</Paragraph>
      </div>

      {error && (
        <Alert message={t('common.messages.error')} description={error} type="error" showIcon style={{ marginBottom: 24 }} />
      )}

      <Tabs
        activeKey={activeKey}
        onChange={handleTabChange}
        className="manage-tabs"
        items={[
          ...(userRole === UserRole.GAME_DEV ? [
            {
              key: 'myAdSpaces',
              label: <span><AppstoreOutlined /> {t('manage.tabs.myAdSpaces')}</span>,
              children: (
                <div className="my-ad-spaces-container">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <Text strong>{t('manage.myAdSpaces.listTitle')}</Text>
                    <Button
                      type="primary"
                      onClick={() => loadMyAdSpaces()}
                      icon={<ReloadOutlined />}
                    >
                      {t('common.buttons.refresh')}
                    </Button>
                  </div>
                  {renderMyAdSpaces()}
                </div>
              )
            },
            {
              key: 'create',
              label: <span><PlusOutlined /> {t('manage.tabs.createAdSpace')}</span>,
              children: (
                <div className="form-container">
                  <Card title={t('manage.createAdSpace.title')} bordered={false}>
                    <Form
                      form={adSpaceForm}
                      layout="vertical"
                      onFinish={handleCreateAdSpace}
                      className="create-form"
                    >
                      <Form.Item
                        name="gameId"
                        label={t('manage.createAdSpace.form.gameId')}
                        rules={[{ required: true, message: t('manage.createAdSpace.form.gameIdRequired') }]}
                      >
                        <Input placeholder={t('manage.createAdSpace.form.gameIdPlaceholder')} />
                      </Form.Item>

                      <Form.Item
                        name="location"
                        label={t('manage.createAdSpace.form.location')}
                        rules={[{ required: true, message: t('manage.createAdSpace.form.locationRequired') }]}
                      >
                        <Input placeholder={t('manage.createAdSpace.form.locationPlaceholder')} />
                      </Form.Item>

                      <Form.Item
                        name="sizeType"
                        label={t('manage.createAdSpace.form.dimensionType')}
                        initialValue="standard"
                      >
                        <Radio.Group>
                          <Radio.Button value="standard">{t('manage.createAdSpace.form.standardRatio')}</Radio.Button>
                          <Radio.Button value="custom">{t('manage.createAdSpace.form.customRatio')}</Radio.Button>
                        </Radio.Group>
                      </Form.Item>

                      <Form.Item
                        noStyle
                        shouldUpdate={(prevValues, currentValues) => prevValues.sizeType !== currentValues.sizeType}
                      >
                        {({ getFieldValue }) =>
                          getFieldValue('sizeType') === 'standard' ? (
                            <Form.Item
                              name="size"
                              label={t('manage.createAdSpace.form.dimension')}
                              rules={[{ required: true, message: t('manage.createAdSpace.form.dimensionRequired') }]}
                            >
                              <Select placeholder={t('manage.createAdSpace.form.dimensionPlaceholder')}>
                                <Option value="16:9">{t('common.dimensions.widescreen')} (16:9)</Option>
                                <Option value="9:16">{t('common.dimensions.portrait')} (9:16)</Option>
                                <Option value="1:1">{t('common.dimensions.square')} (1:1)</Option>
                                <Option value="4:3">{t('common.dimensions.standard')} (4:3)</Option>
                                <Option value="21:9">{t('common.dimensions.ultrawide')} (21:9)</Option>
                              </Select>
                            </Form.Item>
                          ) : (
                            <Form.Item label={t('manage.createAdSpace.form.customDimension')}>
                              <Input.Group compact>
                                <Form.Item
                                  name={['customSize', 'width']}
                                  noStyle
                                  rules={[{ required: true, message: t('manage.createAdSpace.form.widthRequired') }]}
                                >
                                  <InputNumber min={1} max={100} style={{ width: '45%' }} placeholder={t('common.width')} />
                                </Form.Item>
                                <Input
                                  style={{ width: '10%', textAlign: 'center', pointerEvents: 'none', backgroundColor: '#fff' }}
                                  placeholder=":"
                                  disabled
                                />
                                <Form.Item
                                  name={['customSize', 'height']}
                                  noStyle
                                  rules={[{ required: true, message: t('manage.createAdSpace.form.heightRequired') }]}
                                >
                                  <InputNumber min={1} max={100} style={{ width: '45%' }} placeholder={t('common.height')} />
                                </Form.Item>
                              </Input.Group>
                            </Form.Item>
                          )
                        }
                      </Form.Item>

                      <Form.Item
                        name="price"
                        label={t('manage.createAdSpace.form.price')}
                        rules={[{ required: true, message: t('manage.createAdSpace.form.priceRequired') }]}
                      >
                        <InputNumber
                          min={0.000000001}
                          step={0.1}
                          precision={9}
                          placeholder={t('manage.createAdSpace.form.pricePlaceholder')}
                          style={{ width: '100%' }}
                        />
                      </Form.Item>

                      <Form.Item>
                        <Button
                          type="primary"
                          htmlType="submit"
                          loading={loading}
                          className="submit-button"
                        >
                          {t('manage.createAdSpace.form.submit')}
                        </Button>
                      </Form.Item>
                    </Form>
                  </Card>
                </div>
              )
            }
          ] : []),
          ...(userRole === UserRole.ADMIN ? [
            {
              key: 'platformManage',
              label: <span><SettingOutlined /> {t('manage.tabs.platformManage')}</span>,
              children: (
                <div>
                  <Row gutter={[24, 24]}>
                    <Col xs={24}>
                      <Card
                        title={<><BankOutlined /> {t('manage.platformManage.factoryInfo.title')}</>}
                        className="factory-info-card"
                        bordered={false}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
                          <Text strong style={{ marginRight: 8 }}>{t('manage.platformManage.factoryInfo.objectId')}:</Text>
                          <Text
                            copyable={{ tooltips: [t('common.buttons.copy'), t('common.messages.copied')] }}
                            style={{ marginRight: 8, fontFamily: 'monospace', fontSize: '13px' }}
                            ellipsis={{ tooltip: CONTRACT_CONFIG.FACTORY_OBJECT_ID }}
                          >
                            {CONTRACT_CONFIG.FACTORY_OBJECT_ID}
                          </Text>
                          <Tooltip title={t('common.buttons.viewInExplorer')}>
                            <Button
                              size="small"
                              type="primary"
                              icon={<LinkOutlined />}
                              onClick={() => window.open(getExplorerUrl('object', CONTRACT_CONFIG.FACTORY_OBJECT_ID), '_blank')}
                            >
                              {t('manage.platformManage.factoryInfo.view')}
                            </Button>
                          </Tooltip>
                        </div>
                        <Alert
                          message={t('manage.platformManage.factoryInfo.description')}
                          description={t('manage.platformManage.factoryInfo.descriptionText')}
                          type="info"
                          showIcon
                        />
                      </Card>
                    </Col>

                    <Col xs={24} md={12}>
                      <Card
                        title={<><DollarOutlined /> {t('manage.platformManage.platformRatio.title')}</>}
                        className="platform-ratio-card"
                        bordered={false}
                      >
                        <Form
                          form={platformRatioForm}
                          layout="vertical"
                          onFinish={handleUpdatePlatformRatio}
                          className="ratio-form"
                          initialValues={{ ratio: currentPlatformRatio }}
                        >
                          <Form.Item
                            name="ratio"
                            label={t('manage.platformManage.platformRatio.label')}
                            rules={[
                              { required: true, message: t('manage.platformManage.platformRatio.required') },
                              { type: 'number', min: 0, max: 100, message: t('manage.platformManage.platformRatio.rangeError') }
                            ]}
                          >
                            <InputNumber
                              min={0}
                              max={100}
                              precision={0}
                              placeholder={t('manage.platformManage.platformRatio.placeholder')}
                              style={{ width: '100%' }}
                            />
                          </Form.Item>

                          <Alert
                            message={t('manage.platformManage.platformRatio.currentRatio')}
                            description={t('manage.platformManage.platformRatio.currentRatioDesc', { ratio: currentPlatformRatio })}
                            type="info"
                            showIcon
                            style={{ marginBottom: 16 }}
                          />

                          <Form.Item>
                            <Button
                              type="primary"
                              htmlType="submit"
                              loading={platformRatioLoading}
                              className="submit-button"
                              icon={<DollarOutlined />}
                            >
                              {t('manage.platformManage.platformRatio.updateButton')}
                            </Button>
                          </Form.Item>
                        </Form>
                      </Card>
                    </Col>

                    <Col xs={24} md={12}>
                      <Card
                        title={<><UserAddOutlined /> {t('manage.platformManage.registerDev.title')}</>}
                        className="register-dev-card"
                        bordered={false}
                      >
                        <Form
                          form={devRegisterForm}
                          layout="vertical"
                          onFinish={handleRegisterGameDev}
                          className="register-form"
                        >
                          <Form.Item
                            name="devAddress"
                            label={t('manage.platformManage.registerDev.addressLabel')}
                            rules={[{ required: true, message: t('common.messages.required') }]}
                          >
                            <Input placeholder={t('manage.platformManage.registerDev.addressPlaceholder')} />
                          </Form.Item>

                          <Form.Item>
                            <Button
                              type="primary"
                              htmlType="submit"
                              loading={loading}
                              className="submit-button"
                              icon={<UserAddOutlined />}
                            >
                              {t('manage.platformManage.registerDev.registerButton')}
                            </Button>
                          </Form.Item>
                        </Form>
                      </Card>
                    </Col>
                  </Row>

                  <div className="registered-devs-section" style={{ marginTop: 24 }}>
                    <Card
                      title={<><TeamOutlined /> {t('manage.platformManage.registeredDevs.title')}</>}
                      bordered={false}
                      extra={
                        <Button
                          onClick={async () => {
                            const { getGameDevsFromFactory } = await import('../utils/contract');
                            const devs = await getGameDevsFromFactory(CONTRACT_CONFIG.FACTORY_OBJECT_ID);
                            setRegisteredDevs(devs);
                          }}
                          icon={<ReloadOutlined />}
                        >
                          {t('manage.platformManage.registeredDevs.refreshButton')}
                        </Button>
                      }
                    >
                      {renderRegisteredDevs()}
                    </Card>
                  </div>
                </div>
              )
            }
          ] : [])
        ]}
      />

      <Modal
        title={t('manage.priceModal.title')}
        open={priceModalVisible}
        onCancel={() => setPriceModalVisible(false)}
        onOk={handlePriceUpdateSubmit}
        confirmLoading={priceUpdateLoading}
        className="price-update-modal"
      >
        <Form layout="vertical">
          <Form.Item
            label={t('manage.priceModal.currentAdSpace')}
            className="price-form-item"
          >
            <Input value={currentAdSpace?.name} disabled />
          </Form.Item>
          <Form.Item
            label={t('manage.priceModal.currentPrice')}
            className="price-form-item"
          >
            <Input
              value={currentAdSpace ? parseFloat((Number(currentAdSpace.price) / 1000000000).toFixed(9)) : ''}
              disabled
            />
          </Form.Item>
          <Form.Item
            label={t('manage.priceModal.newPrice')}
            className="price-form-item"
          >
            <InputNumber
              min={0.000000001}
              step={0.1}
              precision={9}
              value={newPrice}
              onChange={setNewPrice}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ManagePage;