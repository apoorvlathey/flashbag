import type { NextPage } from "next";
import Head from "next/head";
import React, { useEffect, useState } from "react";
import { Center, Box, VStack, Heading, Button } from "@chakra-ui/react";
import Layout from "@/components/Layout";
import axios from "axios";
import {
  useAccount,
  useNetwork,
  useContractWrite,
  usePrepareContractWrite,
  useWaitForTransaction,
} from "wagmi";
import { utils, constants } from "ethers";
import { aTEST_Goerli, FlashBagGoerli } from "@/config";
import FlashBagABI from "@/abis/FlashBag.json";

const Home: NextPage = () => {
  const { address } = useAccount();
  const { chain } = useNetwork();

  const [balance, setBalance] = useState<string>();

  const { config: bridgeAaveConfig } = usePrepareContractWrite({
    addressOrName: FlashBagGoerli ?? constants.AddressZero,
    contractInterface: FlashBagABI,
    functionName: "bridgeAave",
    args: [balance, 9991],
    enabled: !!balance,
  });
  const {
    data: bridgeAaveData,
    write: bridgeAaveWrite,
    isLoading: isBridgeAaveLoading,
  } = useContractWrite(bridgeAaveConfig);
  const { isLoading: isTransactionPending } = useWaitForTransaction({
    hash: bridgeAaveData?.hash,
  });

  useEffect(() => {
    const fetchTokenBalances = async () => {
      const res = await axios.get<{
        data: {
          items: {
            contract_decimals: number;
            contract_name: string;
            contract_ticker_symbol: string;
            contract_address: string;
            logo_url: string;
            balance: string;
          }[];
        };
      }>(
        `https://api.covalenthq.com/v1/${chain?.id}/address/${address}/balances_v2/?key=${process.env.NEXT_PUBLIC_COVALENT_API_KEY}`
      );
      setBalance(
        res.data.data.items.filter(
          (e) => e.contract_address.toLowerCase() == aTEST_Goerli.toLowerCase()
        )[0].balance
      );
    };

    if (address && chain && !chain.unsupported) {
      fetchTokenBalances();
    }
  }, [address, chain]);

  return (
    <Layout>
      <Head>
        <title>FlashBag</title>
      </Head>
      <Center flexDir="column">
        <Box mt="2rem" py="2rem" px="10rem" boxShadow="2xl" rounded="lg">
          <VStack spacing="2rem">
            <Heading fontSize="2xl">Your Balances</Heading>
          </VStack>
        </Box>
        {balance && (
          <Box>
            <Box>
              aTEST:
              {utils.formatUnits(balance, 18)}
            </Box>
            <Button
              onClick={() => bridgeAaveWrite?.()}
              isDisabled={parseFloat(balance) == 0}
              isLoading={isBridgeAaveLoading || isTransactionPending}
            >
              Move position to Aave Polygon
            </Button>
          </Box>
        )}
      </Center>
    </Layout>
  );
};

export default Home;
