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
  Progress,
  Link,
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
import { poll } from "poll";
import { aTEST_Goerli, aTEST_Mumbai, FlashBagGoerli } from "@/config";
import FlashBagABI from "@/abis/FlashBag.json";

const goerliGraphUrl =
  "https://api.thegraph.com/subgraphs/name/connext/nxtp-amarok-runtime-v0-goerli";
const mumbaiGraphUrl =
  "https://api.thegraph.com/subgraphs/name/connext/nxtp-amarok-runtime-v0-mumbai";

const Home: NextPage = () => {
  const { address } = useAccount();
  const { chain } = useNetwork();

  const [goerliBalance, setGoerliBalance] = useState<string>();
  const [mumbaiBalance, setMumbaiBalance] = useState<string>();
  const [transferId, setTransferId] = useState<string>();
  const [pendingTargetTx, setPendingTargetTx] = useState(false);
  const [targetTxHash, setTargetTxHash] = useState<string>();

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

  const { config: bridgeAaveConfig } = usePrepareContractWrite({
    addressOrName: FlashBagGoerli ?? constants.AddressZero,
    contractInterface: FlashBagABI,
    functionName: "bridgeAave",
    args: [utils.parseEther("1"), 9991], // TODO: use goerliBalance
    enabled: !!goerliBalance,
  });
  const {
    data: bridgeAaveData,
    write: bridgeAaveWrite,
    isLoading: isBridgeAaveLoading,
  } = useContractWrite({
    ...bridgeAaveConfig,
    async onSuccess(data) {
      await data.wait();
      setPendingTargetTx(true);
      storeTransferId(data.hash);
    },
  });
  const { isLoading: isTransactionPending } = useWaitForTransaction({
    hash: bridgeAaveData?.hash,
  });

  const storeTransferId = async (txHash: string) => {
    poll(
      async () => {
        let tid: string | undefined;

        try {
          tid = await getTransferId(txHash);
          setTransferId(tid);
        } catch (e: any) {}
      },
      5000,
      () => {
        console.log(!!transferId);
        return !!transferId; // FIXME: stop polling
      }
    );
  };

  const getTransferId = async (txHash: string): Promise<string> => {
    const res = await axios({
      method: "post",
      url: goerliGraphUrl,
      data: {
        operationName: "originTransfers",
        query: `{
            originTransfers(
              where: {
                transactionHash: "${txHash}"
              }
            ) {
              # Meta Data
              chainId
              transferId
              nonce
              to
              delegate
              receiveLocal
              callData
              slippage
              originSender
              originDomain
              destinationDomain
              # Asset Data
              asset {
                id
                adoptedAsset
                canonicalId
                canonicalDomain
              }
              bridgedAmt
              normalizedIn
              status
              transactionHash
              timestamp
            }
          }`,
        variables: {},
      },
    });

    return res.data.data.originTransfers[0].transferId as string;
  };

  const getTargetTxHash = async (transferId: string): Promise<string> => {
    const res = await axios({
      method: "post",
      url: mumbaiGraphUrl,
      data: {
        operationName: "destinationTransfers",
        query: `{
          destinationTransfers(
            where: {
              transferId: "${transferId}"
            }
          ) {
            # Meta Data
            chainId
            transferId
            nonce
            to
            delegate
            receiveLocal
            callData
            slippage
            originSender
            originDomain
            destinationDomain
            # Asset Data
            asset {
              id
            }
            bridgedAmt
            # Executed event Data
            status
            routers {
              id
            }
            # Executed Transaction
            executedCaller
            executedTransactionHash
            executedTimestamp
            executedGasPrice
            executedGasLimit
            executedBlockNumber
            # Reconciled Transaction
            reconciledCaller
            reconciledTransactionHash
            reconciledTimestamp
            reconciledGasPrice
            reconciledGasLimit
            reconciledBlockNumber
          }
        }`,
        variables: {},
      },
    });

    return res.data.data.destinationTransfers[0]
      .executedTransactionHash as string;
  };

  useEffect(() => {
    if (address && chain && !chain.unsupported) {
      fetchTokenBalances();
    }
  }, [address, chain]);

  useEffect(() => {
    if (transferId) {
      poll(
        async () => {
          let hash: string | undefined;

          try {
            hash = await getTargetTxHash(transferId);
            setPendingTargetTx(false);
            setTargetTxHash(hash);
          } catch (e: any) {}
        },
        5000,
        () => {
          console.log(!!targetTxHash);
          return !!targetTxHash; // FIXME: stop polling
        }
      );
    }
  }, [transferId]);

  useEffect(() => {
    if (targetTxHash) {
      fetchTokenBalances();
    }
  }, [targetTxHash]);

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
                        {goerliBalance
                          ? utils.formatEther(goerliBalance)
                          : address && <Skeleton>123</Skeleton>}
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
                        {mumbaiBalance
                          ? utils.formatEther(mumbaiBalance)
                          : address && <Skeleton>123</Skeleton>}
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
              {pendingTargetTx && (
                <Box mt={4}>
                  <Progress isIndeterminate />
                  <Center fontWeight={"bold"}>
                    ⌛ Waiting for tokens to reach Polygon Mumbai...
                  </Center>
                </Box>
              )}
              {targetTxHash && (
                <Center mt={4} flexDirection={"column"} fontWeight={"bold"}>
                  <Box>✅ Position bridged!</Box>
                  <Link
                    mt={2}
                    color={"cyan.300"}
                    href={`https://mumbai.polygonscan.com/tx/${targetTxHash}`}
                    isExternal
                  >
                    View on Polygonscan ↗️
                  </Link>
                </Center>
              )}
            </Box>
          </Box>
        </Box>
      </Center>
    </Layout>
  );
};

export default Home;
