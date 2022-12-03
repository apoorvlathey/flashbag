import { chain } from "wagmi";

export const supportedChains = [chain.goerli, chain.polygonMumbai];

export const chainIdToRPC = {
  [chain.goerli.id]: process.env.NEXT_PUBLIC_GOERLI_RPC_URL,
  [chain.polygonMumbai.id]: process.env.NEXT_PUBLIC_MUMBAI_RPC_URL,
};
