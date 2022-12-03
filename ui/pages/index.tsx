import type { NextPage } from "next";
import Head from "next/head";
import React, { useEffect, useState } from "react";
import { Center, Box, VStack, Heading } from "@chakra-ui/react";
import axios from "axios";
import Layout from "../components/Layout";
import { useAccount, useNetwork } from "wagmi";
import { utils } from "ethers";
import { aTEST_Goerli } from "@/config";

const Home: NextPage = () => {
  const { address } = useAccount();
  const { chain } = useNetwork();

  const [balances, setBalances] = useState<any[]>();

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
      setBalances(
        res.data.data.items.filter(
          (e) => e.contract_address.toLowerCase() == aTEST_Goerli.toLowerCase()
        )
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
        {balances &&
          balances.map((b) => (
            <Box>
              {b.contract_ticker_symbol}{" "}
              {utils.formatUnits(b.balance, b.contract_decimals)}
            </Box>
          ))}
      </Center>
    </Layout>
  );
};

export default Home;
