// Copyright (c), Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0
// 用到了，用于创建space

import { Transaction } from '@mysten/sui/transactions';
import { Button, Card, Flex, Heading, TextField, Text, Box } from '@radix-ui/themes';
import { useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { useState } from 'react';
import { useNetworkVariable } from './networkConfig';
import { useNavigate } from 'react-router-dom';
// Removed local color constants, will use global CSS variables from global.css

export function CreateSpace() {
  const [price, setPrice] = useState('');
  const [ttl, setTtl] = useState(''); // Store TTL in minutes
  const [name, setName] = useState('');
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

  function createService(priceStr: string, ttlStr: string, nameStr: string) {
    const priceNum = parseInt(priceStr);
    const ttlNum = parseInt(ttlStr); // TTL in minutes

    if (!nameStr || isNaN(priceNum) || priceNum <= 0 || isNaN(ttlNum) || ttlNum <= 0) {
      // Consider using a more integrated notification system than alert()
      alert('Please fill in all fields with valid numbers (Price and Duration must be positive).');
      return;
    }

    const ttlMs = ttlNum * 60 * 1000; // Convert minutes to milliseconds for the contract
    const tx = new Transaction();
    tx.moveCall({
      target: `${packageId}::subscription::create_service_entry`,
      arguments: [tx.pure.u64(priceNum), tx.pure.u64(ttlMs), tx.pure.string(nameStr)],
    });
    tx.setGasBudget(10000000);

    signAndExecute(
      {
        transaction: tx,
      },
      {
        onSuccess: async (result) => {
          console.log('Successfully created space:', result);
          const subscriptionObject = result.effects?.created?.find(
            (item) => item.owner && typeof item.owner === 'object' && 'Shared' in item.owner,
          );
          const createdObjectId = subscriptionObject?.reference?.objectId;

          if (createdObjectId) {
            // Use a more robust avatar generation, e.g., DiceBear from SpaceScroll
            const seed = encodeURIComponent(createdObjectId);
            const avatarUrl = `https://api.dicebear.com/8.x/rings/svg?seed=${seed}&backgroundColor=0f172a,020817&backgroundType=gradientLinear&ringColor=00f5ff,bae6fd`;

            const newSpaceData = {
              id: createdObjectId,
              name: nameStr,
              price: priceNum,
              duration: ttlNum, // Store duration in minutes
              avatarUrl: avatarUrl,
            };
            // Consider a more persistent storage if needed beyond immediate navigation
            localStorage.setItem('newlyCreatedSpaceData', JSON.stringify(newSpaceData));

            navigate('/');
          } else {
            console.error('Could not find created object ID in transaction effects.');
            alert('Space created, but failed to get its ID. Navigating home.');
            navigate('/');
          }
        },
        onError: (error) => {
          console.error('Error creating space:', error);
          alert(`Failed to create space: ${error.message}`);
        },
      },
    );
  }

  return (
    // Use Flex to center the card vertically and horizontally within the viewport
    <Flex justify="center" align="center" style={{ minHeight: 'calc(100vh - 80px)', padding: 'var(--space-4)' }}> {/* Adjust minHeight based on header/footer */}
      {/* Apply the global water-card style */}
      <Card className="water-card" style={{ maxWidth: '480px', width: '100%', padding: 'var(--space-6)' }}>
        <Heading as="h2" size="7" mb="6" align="center" style={{ color: 'var(--primary-text-color)', fontWeight: 600 }}>
          Create Your Space
        </Heading>
        <Flex direction="column" gap="5"> {/* Increased gap for better spacing */}
          {/* Use Box for label + input grouping */}
          <Box>
            <Text as="label" htmlFor="spaceName" size="2" mb="1" weight="medium" style={{ color: 'var(--secondary-text-color)', display: 'block' }}>
              Space Name
            </Text>
            {/* Input fields will inherit global styles */}
            <TextField.Root
              id="spaceName"
              placeholder="Name your digital ocean..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              size="3" // Use Radix size prop
            />
          </Box>
          <Box>
            <Text as="label" htmlFor="subPrice" size="2" mb="1" weight="medium" style={{ color: 'var(--secondary-text-color)', display: 'block' }}>
              Subscription Price (MIST)
            </Text>
            <TextField.Root
              id="subPrice"
              type="number"
              placeholder="e.g., 1000"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              size="3"
            />
          </Box>
          <Box>
            <Text as="label" htmlFor="duration" size="2" mb="1" weight="medium" style={{ color: 'var(--secondary-text-color)', display: 'block' }}>
              Duration (minutes)
            </Text>
            <TextField.Root
              id="duration"
              type="number"
              placeholder="e.g., 43200 (for 30 days)" // Provide a more common example
              value={ttl}
              onChange={(e) => setTtl(e.target.value)}
              size="3"
            />
            <Text as="p" size="1" mt="1" style={{ color: 'var(--secondary-text-color)' }}>
              Time until subscription expires.
            </Text>
          </Box>
          <Flex direction="row" justify="end" mt="5">
            {/* Apply the global primary button style */}
            <Button
              size="3" // Consistent button size
              className="water-button-primary" // Use global class
              onClick={() => createService(price, ttl, name)}
              disabled={!name || !price || !ttl} // Basic validation for button state
            >
              Launch Space
            </Button>
          </Flex>
        </Flex>
      </Card>
    </Flex>
  );
}
