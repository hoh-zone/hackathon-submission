import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Typography, Card, Divider, Select, Space, Spin, Row, Col, Tooltip, Slider, InputNumber, DatePicker, Switch, Alert, message } from 'antd';
import { InfoCircleOutlined, ShoppingCartOutlined, QuestionCircleOutlined, ClockCircleOutlined, WalletOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { AdSpace, PurchaseAdSpaceParams } from '../../types';
import { calculateLeasePrice, formatSuiAmount } from '../../utils/contract';
import WalrusUpload from '../walrus/WalrusUpload';
import dayjs from 'dayjs';
import './AdSpaceForm.scss';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { getWalCoinType } from '../../config/walrusConfig';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface AdSpaceFormProps {
  adSpace: AdSpace;
  onSubmit: (values: PurchaseAdSpaceParams) => void;
  isLoading: boolean;
}

const AdSpaceForm: React.FC<AdSpaceFormProps> = ({
  adSpace,
  onSubmit,
  isLoading
}) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [leaseDays, setLeaseDays] = useState<number>(30);
  const [totalPrice, setTotalPrice] = useState<string>("0");
  const [calculating, setCalculating] = useState<boolean>(false);
  const [contentUrl, setContentUrl] = useState<string>("");
  const [useCustomStartTime, setUseCustomStartTime] = useState<boolean>(false);
  const [startTime, setStartTime] = useState<dayjs.Dayjs | null>(null);
  const [contentUploaded, setContentUploaded] = useState<boolean>(false); // 添加上传成功状态

  // 添加上传参数状态
  const [contentParams, setContentParams] = useState<{
    url: string;
    blobId?: string;
    storageSource: string;
  }>({
    url: '',
    storageSource: 'external'
  });

  // 添加钱包余额相关状态
  const [walletBalance, setWalletBalance] = useState<string>('0');
  const [insufficientBalance, setInsufficientBalance] = useState<boolean>(false);
  const [walBalance, setWalBalance] = useState<string>('0');

  // 获取钱包和Sui客户端
  const account = useCurrentAccount();
  const suiClient = useSuiClient();

  // 获取租赁价格和检查钱包余额
  useEffect(() => {
    const fetchPriceAndCheckBalance = async () => {
      setCalculating(true);
      try {
        console.log('正在获取广告位价格', adSpace.id, leaseDays);
        // 直接调用contract.ts中的calculateLeasePrice函数
        const price = await calculateLeasePrice(adSpace.id, leaseDays);
        console.log('获取到的价格 (原始):', price);
        const formattedPrice = formatSuiAmount(price);
        console.log('格式化后的价格:', formattedPrice);

        if (formattedPrice === 'NaN' || !formattedPrice) {
          throw new Error('获取到的价格无效');
        }

        setTotalPrice(formattedPrice);

        // 如果有账户，检查余额是否足够
        if (account && suiClient) {
          try {
            // 获取SUI代币余额
            const { totalBalance } = await suiClient.getBalance({
              owner: account.address,
              coinType: '0x2::sui::SUI'
            });

            const priceValue = BigInt(price);
            const balanceValue = BigInt(totalBalance);

            // 保存钱包余额到状态
            const formattedBalance = formatSuiAmount(totalBalance);
            setWalletBalance(formattedBalance);

            // 显示余额信息
            console.log('钱包余额:', formattedBalance, 'SUI');
            console.log('购买价格:', formattedPrice, 'SUI');

            // 判断余额是否足够
            const isBalanceInsufficient = balanceValue < priceValue;
            setInsufficientBalance(isBalanceInsufficient);

            // 如果余额不足，显示警告
            if (isBalanceInsufficient) {
              // 先使用 t() 函数处理占位符替换，然后将结果传递给 message.warning
              const warningMsg = t('nftDetail.transaction.insufficientBalance', {
                price: formattedPrice,
                balance: formattedBalance
              });
              message.warning({
                content: warningMsg,
                duration: 5
              });
            }

            // 获取WAL代币余额（如果存在）
            try {
              // 从配置文件获取当前环境的WAL代币类型
              const walCoinType = getWalCoinType();
              console.log('使用WAL代币类型:', walCoinType);

              const { totalBalance: walTotalBalance } = await suiClient.getBalance({
                owner: account.address,
                coinType: walCoinType
              });

              // 保存WAL余额到状态
              const formattedWalBalance = formatSuiAmount(walTotalBalance);
              setWalBalance(formattedWalBalance);
              console.log('WAL余额:', formattedWalBalance, 'WAL');
            } catch (walError) {
              console.error('获取WAL余额失败:', walError);
              // 如果获取WAL余额失败，设置为0
              setWalBalance('0');
            }
          } catch (balanceError) {
            console.error('检查余额失败:', balanceError);
          }
        }
      } catch (error) {
        console.error('获取价格失败:', error);
        setTotalPrice('');
      } finally {
        setCalculating(false);
      }
    };

    fetchPriceAndCheckBalance();
  }, [adSpace.id, leaseDays, adSpace.price, account, suiClient]);

  // 处理内容上传参数变更
  const handleContentParamsChange = (data: { url: string; blobId?: string; storageSource: string }) => {
    setContentParams(data);
    setContentUrl(data.url);
    form.setFieldsValue({ contentUrl: data.url });

    // 只有当存储来源是walrus且URL存在时，才设置为已上传状态
    if (data.storageSource === 'walrus' && data.url) {
      setContentUploaded(true);
    }
    // 外部URL的成功状态由WalrusUpload组件中的确认按钮触发
    // 这里只处理参数变更，不设置成功状态
  };

  const handleSubmit = (values: any) => {
    // 如果价格无效，不允许提交
    if (totalPrice === 'NaN' || !totalPrice) {
      console.error('价格无效，无法提交');
      return;
    }

    const priceInMist = (Number(totalPrice) * 1000000000).toString();
    console.log('提交的价格 (MIST):', priceInMist);

    // 如果projectUrl为空，则使用"#"作为默认值
    const projectUrl = values.projectUrl ? values.projectUrl : "#";

    const params: PurchaseAdSpaceParams = {
      adSpaceId: adSpace.id,
      contentUrl: contentParams.url,
      brandName: values.brandName,
      projectUrl: projectUrl,
      leaseDays: values.leaseDays,
      price: priceInMist,
      blobId: contentParams.blobId,
      storageSource: contentParams.storageSource
    };

    // 如果使用自定义开始时间，添加startTime字段（移除了!contentUploaded条件）
    if (useCustomStartTime && startTime) {
      params.startTime = Math.floor(startTime.valueOf() / 1000); // 转换为Unix时间戳（秒）
      console.log('使用自定义开始时间:', new Date(params.startTime * 1000).toLocaleString(), '时间戳:', params.startTime);
    } else {
      console.log('使用当前时间作为开始时间');
    }

    onSubmit(params);
  };

  const handleContentUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContentUrl(e.target.value);
    setContentParams({
      url: e.target.value,
      storageSource: 'external'
    });
  };

  // 当内容上传成功后，更新表单字段的禁用状态
  useEffect(() => {
    if (contentUploaded) {
      // 设置租赁天数为只读
      form.setFieldValue('leaseDays', leaseDays);
      // 不再自动关闭自定义开始时间，保留用户的选择
      // 只是禁用UI控件，但保留值
    }
  }, [contentUploaded, leaseDays, form]);

  return (
    <Card className="ad-space-form">
      <Title level={3}>{t('purchase.title')}</Title>
      <Divider />

      <div className="ad-space-info">
        <Row>
          <Col span={12}>
            <div style={{ marginBottom: '10px' }}>
              <Text strong>{t('purchase.form.brandName')}：</Text>
              <Text>{adSpace.name}</Text>
            </div>
            <div style={{ marginBottom: '10px' }}>
              <Text strong>{t('manage.createAdSpace.form.location')}：</Text>
              <Text>{adSpace.location}</Text>
            </div>
            <div>
              <Text strong>{t('manage.createAdSpace.form.dimension')}：</Text>
              <Text>{adSpace.aspectRatio || '16:9'}</Text>
            </div>
          </Col>
          <Col span={12}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Text strong>{t('manage.createAdSpace.form.price')}：</Text>
              <Text style={{ color: 'var(--primary)', fontWeight: 600, marginLeft: '4px' }}>
                {Number(adSpace.price) / 1000000000} SUI / {t('common.time.day')}
              </Text>
              <Tooltip title={t('common.price.discount')}>
                <QuestionCircleOutlined style={{ marginLeft: 8, color: 'var(--primary)' }} />
              </Tooltip>
            </div>
          </Col>
        </Row>
      </div>

      <Divider>
        <Text type="secondary">{t('purchase.form.fillAdInfo')}</Text>
      </Divider>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          leaseDays: 30,
          useCustomStartTime: false
        }}
      >
        <Row gutter={16}>
          <Col span={24}>
            <div className="form-section-title">{t('purchase.form.basicInfo')}</div>
          </Col>
          <Col span={12}>
            <Form.Item
              name="brandName"
              label={t('purchase.form.brandName')}
              rules={[
                { required: true, message: t('purchase.form.brandNameRequired') }
              ]}
            >
              <Input placeholder={t('purchase.form.brandNamePlaceholder')} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="leaseDays"
              label={t('purchase.form.leaseDays')}
              rules={[{ required: true, message: t('purchase.form.leaseDaysRequired') }]}
              extra={contentUploaded && contentParams.storageSource === 'walrus' ? t('purchase.form.leaseDaysExtraUploaded') : t('purchase.form.leaseDaysExtra')}
            >
              <InputNumber
                min={1}
                max={365}
                precision={0}
                value={leaseDays}
                onChange={(value) => {
                  const days = Number(value);
                  if (!isNaN(days) && days >= 1 && days <= 365) {
                    setLeaseDays(days);
                    form.setFieldsValue({ leaseDays: days });
                  }
                }}
                addonAfter={t('common.time.day')}
                style={{ width: '100%' }}
                disabled={contentUploaded && contentParams.storageSource === 'walrus'}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <div className="form-section-title">{t('purchase.form.leaseSettings')}</div>
          </Col>
          <Col span={12}>
            <Form.Item
              name="useCustomStartTime"
              label={t('purchase.form.customStartTime')}
              valuePropName="checked"
            >
              <Switch
                checkedChildren={t('purchase.form.enabled')}
                unCheckedChildren={t('purchase.form.default')}
                onChange={(checked) => setUseCustomStartTime(checked)}
                disabled={contentUploaded && contentParams.storageSource === 'walrus'}
              />
            </Form.Item>
            <Text type="secondary" style={{ display: 'block', marginTop: '-15px', marginBottom: '10px' }}>
              {t('purchase.form.defaultTimeDesc')}
            </Text>
          </Col>
          <Col span={12}>
            <Form.Item
              name="startTime"
              label={t('purchase.form.adStartTime')}
              dependencies={['useCustomStartTime']}
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!getFieldValue('useCustomStartTime') || value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error(t('purchase.form.timeRequired')));
                  },
                }),
              ]}
            >
              <DatePicker
                showTime
                disabled={!useCustomStartTime || (contentUploaded && contentParams.storageSource === 'walrus')}
                style={{ width: '100%' }}
                placeholder={contentUploaded ? t('purchase.form.useDefaultTime') : t('purchase.form.selectStartTime')}
                onChange={(date) => setStartTime(date)}
                disabledDate={(current) => {
                  // 不能选择过去的日期
                  return current && current < dayjs().startOf('day');
                }}
                format="YYYY-MM-DD HH:mm:ss"
              />
            </Form.Item>
          </Col>
        </Row>

        {contentUploaded && contentParams.storageSource === 'walrus' && (
          <Alert
            message={t('purchase.form.uploadSuccessAlert')}
            description={useCustomStartTime && startTime
              ? t('purchase.form.uploadSuccessAlertWithCustomTime', {
                  time: startTime.format('YYYY-MM-DD HH:mm:ss')
                })
              : t('purchase.form.uploadSuccessAlertDesc')}
            type="success"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        )}

        {contentUploaded && contentParams.storageSource === 'external' && (
          <Alert
            message={t('purchase.form.externalUrlAlert')}
            description={t('purchase.form.externalUrlAlertDesc')}
            type="success"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        )}

        <Row gutter={16}>
          <Col span={24}>
            <div className="form-section-title">{t('purchase.form.adContent')}</div>
          </Col>
          <Col span={24}>
            <Form.Item
              name="contentUrl"
              label={t('purchase.form.adContent')}
              rules={[
                { required: true, message: t('purchase.form.adContentRequired') }
              ]}
              // 移除额外的比例提示，因为WalrusUpload组件已经包含了这个提示
            >
              <WalrusUpload
                leaseDays={leaseDays}
                customStartTime={useCustomStartTime && startTime ? Math.floor(startTime.valueOf() / 1000) : undefined}
                onChange={handleContentParamsChange}
                aspectRatio={adSpace.aspectRatio}
                walletBalance={walletBalance}
                walBalance={walBalance}
                insufficientBalance={insufficientBalance}
              />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              name="projectUrl"
              label={t('purchase.form.projectUrl')}
              rules={[
                { type: 'url', message: t('purchase.form.projectUrlInvalid') }
              ]}
              extra={t('purchase.form.projectUrlExtra')}
            >
              <Input placeholder="https://example.com" />
            </Form.Item>
          </Col>
        </Row>

        <Divider />

        <div className="price-summary">
          <Space direction="vertical" style={{ width: '100%' }}>
            <div className="price-breakdown">
              <div className="price-breakdown-item">
                <Text>{t('purchase.form.yourLeasePeriod')}:</Text>
                <Text>{leaseDays} {t('purchase.form.days')}</Text>
              </div>
            </div>

            {calculating ? (
              <div className="price-loading">
                <Spin size="small" />
                <Text style={{ marginLeft: 8 }}>{t('purchase.form.calculatingPrice')}</Text>
              </div>
            ) : (
              <div className="total-price">
                <Row justify="space-between" align="middle">
                  <Col>{t('purchase.form.totalPrice')}:</Col>
                  <Col>
                    {totalPrice === 'NaN' || !totalPrice ? (
                      <Text type="danger">{t('purchase.form.priceCalculationFailed')}</Text>
                    ) : (
                      <Text>{totalPrice} SUI</Text>
                    )}
                  </Col>
                </Row>

                {/* 显示钱包余额 */}
                <Row justify="space-between" align="middle" style={{ marginTop: '8px' }}>
                  <Col>
                    <Space>
                      <WalletOutlined />
                      <Text type="secondary">{t('nftDetail.modals.renewLease.walletBalance')}</Text>
                    </Space>
                  </Col>
                  <Col>
                    <Text type={insufficientBalance ? 'danger' : 'secondary'} strong={insufficientBalance}>
                      {walletBalance} SUI {insufficientBalance && <span style={{ color: '#ff4d4f' }}>{t('nftDetail.modals.renewLease.insufficientBalanceHint')}</span>}
                    </Text>
                  </Col>
                </Row>

                {/* 如果选择上传到Walrus，显示WAL余额 */}
                {contentParams.storageSource === 'walrus' && (
                  <Row justify="space-between" align="middle" style={{ marginTop: '8px' }}>
                    <Col>
                      <Space>
                        <WalletOutlined />
                        <Text type="secondary">{t('nftDetail.modals.renewLease.walBalance')}</Text>
                      </Space>
                    </Col>
                    <Col>
                      <Text type="secondary">
                        {walBalance} WAL
                      </Text>
                    </Col>
                  </Row>
                )}
              </div>
            )}
          </Space>
        </div>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={isLoading || calculating}
            disabled={calculating || totalPrice === 'NaN' || !totalPrice || insufficientBalance}
            className="submit-button"
            icon={<ShoppingCartOutlined />}
            title={insufficientBalance ? t('nftDetail.transaction.insufficientBalance', { price: totalPrice, balance: walletBalance }) : ''}
          >
            {t('purchase.form.confirmPurchase')}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default AdSpaceForm;