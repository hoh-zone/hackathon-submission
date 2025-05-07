// Copyright (c), Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { Transaction } from '@mysten/sui/transactions';
import { Button, Card, Flex, Text, TextField, Heading } from '@radix-ui/themes';
import { useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { useState } from 'react';
import { useNetworkVariable } from './networkConfig';
import { useNavigate } from 'react-router-dom';
import { InfoCircledIcon, PlusIcon, ArrowLeftIcon } from '@radix-ui/react-icons';

interface CreateServiceProps {
  onBack: () => void;
}

export function CreateService({ onBack }: CreateServiceProps) {
  const [price, setPrice] = useState('');
  const [ttl, setTtl] = useState('');
  const [name, setName] = useState('');
  const [maxSubscribers, setMaxSubscribers] = useState('');
  const packageId = useNetworkVariable('packageId');
  const suiClient = useSuiClient();
  const navigate = useNavigate();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction({
    execute: async ({ bytes, signature }) =>
      await suiClient.executeTransactionBlock({
        transactionBlock: bytes,
        signature,
        options: {
          showRawEffects: true,
          showEffects: true,
        },
      }),
  });

  function createService(price: number, ttl: number, name: string) {
    const maxSubscribersNum = parseInt(maxSubscribers) || 0;

    if (!price || price <= 0 || !ttl || ttl <= 0 || name === '') {
      alert('请确保名称、价格和时长都已正确填写，价格和时长必须大于 0。');
      return;
    }

    const ttlMs = ttl * 60 * 1000;
    const tx = new Transaction();
    tx.moveCall({
      target: `${packageId}::subscription::create_service_entry`,
      arguments: [tx.pure.u64(price), tx.pure.u64(ttlMs), tx.pure.string(name)],
    });
    tx.setGasBudget(10000000);
    signAndExecute(
      {
        transaction: tx,
      },
      {
        onSuccess: async (result) => {
          console.log('res', result);
          const subscriptionObject = result.effects?.created?.find(
            (item) => item.owner && typeof item.owner === 'object' && 'Shared' in item.owner,
          );
          const createdObjectId = subscriptionObject?.reference?.objectId;
          if (createdObjectId) {
            navigate(`/admin/space/${createdObjectId}`);
          } else {
            alert('创建失败，无法找到创建的对象 ID。');
          }
        },
        onError: (error) => {
          console.error("创建服务失败:", error);
          alert(`创建服务时出错: ${error.message || '未知错误'}`);
        }
      },
    );
  }

  const handleViewAll = () => {
    navigate(`/myspaces`);
  };

  const waterRippleBackground = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 50' width='100' height='50'%3E%3Cpath fill='%23ffffff' fill-opacity='0.1' d='M0 50 Q 25 25 50 50 T 100 50 V 0 H 0 Z'/%3E%3Cpath fill='%23ffffff' fill-opacity='0.05' d='M0 40 Q 25 15 50 40 T 100 40 V 0 H 0 Z'/%3E%3C/svg%3E")`;

  return (
    <Card style={{
      maxWidth: '650px',
      width: '90%',
      margin: '4rem auto 2rem auto',
      background: 'rgba(255, 255, 255, 0.85)',
      backdropFilter: 'blur(10px)',
      borderRadius: '20px',
      boxShadow: '0 8px 30px rgba(0, 121, 107, 0.15)',
      border: '1px solid rgba(173, 232, 244, 0.7)',
      overflow: 'hidden',
    }}>
      <Flex direction="column" gap="4" p="4">
        <Heading size="5" style={{ color: '#004d40', textAlign: 'center' }}>创建新的会员空间</Heading>

        <label>
          <Text as="div" size="3" weight="medium" mb="1" color="teal" style={{ color: '#006064' }}>
            空间名称
          </Text>
          <TextField.Root
            placeholder="例如：基础支持者、核心粉丝"
            value={name}
            onChange={(e) => setName(e.target.value)}
            size="3"
            style={{
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.85)',
              border: '1px solid #4dd0e1',
              boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.05)',
              color: '#333333',
            }}
          />
        </label>

        <label>
          <Text as="div" size="3" weight="medium" mb="1" color="teal" style={{ color: '#006064' }}>
            订阅费（MIST）
          </Text>
          <TextField.Root
            type="number"
            placeholder="例如：500"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            size="3"
            style={{
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.85)',
              border: '1px solid #4dd0e1',
              boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.05)',
              color: '#333333',
            }}
          />
        </label>

        <label>
          <Text as="div" size="3" weight="medium" mb="1" color="teal" style={{ color: '#006064' }}>
            有效期（分钟）
          </Text>
          <TextField.Root
            type="number"
            placeholder="例如：43200 (30天)"
            value={ttl}
            onChange={(e) => setTtl(e.target.value)}
            size="3"
            style={{
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.85)',
              border: '1px solid #4dd0e1',
              boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.05)',
              color: '#333333',
            }}
          />
          <Text as="div" size="2" color="gray" mt="2" style={{ color: '#00796b' }}>
            <InfoCircledIcon style={{ verticalAlign: 'middle', marginRight: '4px' }} />
            将作为流动性数量，流动性数量将用于计算用户的订阅费用。
          </Text>
        </label>


        <hr style={{ border: 'none', borderTop: '1px solid rgba(0, 105, 92, 0.3)', margin: '1.5rem 0' }} />

        <Flex direction="row" gap="4" justify="center" mt="2">
          <Button
            size="3"
            onClick={() => {
              const priceNum = parseInt(price) || 0;
              const ttlNum = parseInt(ttl) || 0;
              createService(priceNum, ttlNum, name);
            }}
            style={{
              background: 'linear-gradient(135deg, #26c6da 0%, #00acc1 100%)',
              color: 'white',
              borderRadius: '10px',
              fontWeight: '500',
              padding: '10px 20px',
              boxShadow: '0 4px 10px rgba(0, 172, 193, 0.4)',
              transition: 'all 0.3s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #4dd0e1 0%, #26c6da 100%)';
              e.currentTarget.style.boxShadow = '0 6px 15px rgba(0, 172, 193, 0.5)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #26c6da 0%, #00acc1 100%)';
              e.currentTarget.style.boxShadow = '0 4px 10px rgba(0, 172, 193, 0.4)';
            }}
          >
            <PlusIcon style={{ marginRight: '5px' }} /> 发布空间
          </Button>
          <Button
            size="3"
            variant="outline"
            onClick={handleViewAll}
            color="cyan"
            style={{
              borderRadius: '10px',
              fontWeight: '500',
              padding: '10px 20px',
              borderColor: '#00acc1',
              color: '#006064',
              transition: 'all 0.3s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(77, 208, 225, 0.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            查看您发布的所有空间
          </Button>
        </Flex>

        <Flex justify="end" mt="4">
          <Button
            size="2"
            variant="ghost"
            onClick={onBack}
            style={{
              color: '#006064',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <ArrowLeftIcon width={16} height={16} /> 返回
          </Button>
        </Flex>
      </Flex>
    </Card>
  );
}
