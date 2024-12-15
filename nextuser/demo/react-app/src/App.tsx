import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";

import { Box, Container, Flex, Heading } from "@radix-ui/themes";
import { useState } from "react";
import Layout from './Layout';

function App() {
  const currentAccount = useCurrentAccount();
 
  return (
    <>
      <Flex
        position="sticky"
        px="4"
        py="2"
        justify="between"
        style={{
          borderBottom: "1px solid var(--gray-a2)",
        }}
      >
        <Box>
          <Heading>存款利息抽奖</Heading>
        </Box>

        <Box>
          <ConnectButton />
        </Box>
      </Flex>
      <Container>
        <Container
          mt="5"
          pt="2"
          px="4"
          style={{ background: "var(--gray-a2)", minHeight: 500 }}
        >
          {currentAccount ?  <Layout /> : (
            <Heading>Please connect your wallet</Heading>
          )}
        </Container>
      </Container>
    </>
  );
}

export default App;
