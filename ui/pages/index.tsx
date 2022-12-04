import type { NextPage } from "next";
import Head from "next/head";
import React, { useEffect, useState } from "react";
import {
  Center,
  Box,
  VStack,
  Heading,
  Button,
  Stack,
  HStack,
  Image,
  Divider,
  Skeleton,
} from "@chakra-ui/react";
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
import { aTEST_Goerli, aTEST_Mumbai, FlashBagGoerli } from "@/config";
import FlashBagABI from "@/abis/FlashBag.json";

const Home: NextPage = () => {
  const { address } = useAccount();
  const { chain } = useNetwork();

  const [goerliBalance, setGoerliBalance] = useState<string>();
  const [mumbaiBalance, setMumbaiBalance] = useState<string>();

  const { config: bridgeAaveConfig } = usePrepareContractWrite({
    addressOrName: FlashBagGoerli ?? constants.AddressZero,
    contractInterface: FlashBagABI,
    functionName: "bridgeAave",
    args: [goerliBalance, 9991],
    enabled: !!goerliBalance,
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
      setGoerliBalance(
        res.data.data.items.filter(
          (e) => e.contract_address.toLowerCase() == aTEST_Goerli.toLowerCase()
        )[0].balance
      );
      const resMumbai = await axios.get<{
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
        `https://api.covalenthq.com/v1/${80001}/address/${address}/balances_v2/?key=${
          process.env.NEXT_PUBLIC_COVALENT_API_KEY
        }`
      );
      setMumbaiBalance(
        resMumbai.data.data.items.filter(
          (e) => e.contract_address.toLowerCase() == aTEST_Mumbai.toLowerCase()
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
        <Box mt="2rem" py="2rem">
          <VStack spacing="2rem">
            <Heading fontSize="2xl">Your Aave Positions</Heading>
          </VStack>
          <Box p={4}>
            <Box
              pb="1rem"
              border="1px"
              w="35rem"
              rounded="lg"
              borderColor={"gray.400"}
            >
              <Stack
                mx={4}
                direction={"row"}
                justifyContent="space-between"
                spacing={5}
              >
                <Box flex={1}>
                  <Center>
                    <HStack py="1rem">
                      <Image w="1.5rem" src="/icons/chains/Goerli.png" />
                      <Heading fontSize={"2xl"}>Goerli</Heading>
                    </HStack>
                  </Center>
                  <Box border="2px" borderColor="gray.600" rounded="lg">
                    <Stack
                      mt={4}
                      mx={4}
                      direction={"row"}
                      justifyContent="space-between"
                      spacing={5}
                    >
                      <Box flex={1} fontWeight="bold">
                        aTEST
                      </Box>
                      <Box flex={1} textAlign="right">
                        {goerliBalance ? (
                          utils.formatEther(goerliBalance)
                        ) : (
                          <Skeleton />
                        )}
                      </Box>
                    </Stack>
                    <Box pt={4} px={4} mb={-4}>
                      <Divider />
                    </Box>
                    <Center my="2rem" fontWeight={"bolder"} color="red.200">
                      APY: 3.4%
                    </Center>
                  </Box>
                </Box>
                <Box flex={1}>
                  <Center>
                    <HStack py="1rem">
                      <Image
                        w="1.5rem"
                        src="/icons/chains/Polygon Mumbai.png"
                      />
                      <Heading fontSize={"2xl"}>Polygon Mumbai</Heading>
                    </HStack>
                  </Center>
                  <Box border="2px" borderColor="gray.600" rounded="lg">
                    <Stack
                      mt={4}
                      mx={4}
                      direction={"row"}
                      justifyContent="space-between"
                      spacing={5}
                    >
                      <Box flex={1} fontWeight="bold">
                        aTEST
                      </Box>
                      <Box flex={1} textAlign="right">
                        {mumbaiBalance ? (
                          utils.formatEther(mumbaiBalance)
                        ) : (
                          <Skeleton />
                        )}
                      </Box>
                    </Stack>
                    <Box pt={4} px={4} mb={-4}>
                      <Divider />
                    </Box>
                    <Center my="2rem" fontWeight={"bolder"} color="green.200">
                      APY: 7.5%
                    </Center>
                  </Box>
                </Box>
              </Stack>
              <Center pt={4}>
                {/* TODO: add approval button */}
                <Button
                  onClick={() => bridgeAaveWrite?.()}
                  isDisabled={!goerliBalance || parseFloat(goerliBalance) == 0}
                  isLoading={isBridgeAaveLoading || isTransactionPending}
                >
                  ⚡Bridge position ➡️ Aave Polygon 🤑
                </Button>
              </Center>
            </Box>
          </Box>
        </Box>
      </Center>
    </Layout>
  );
};

export default Home;
