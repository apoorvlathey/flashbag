import { chain } from "wagmi";

export const aTEST_Goerli = "0x7f62Ac86A528685C5e8BF6019E7DFe6E1587E03d";
export const FlashBagGoerli = "0x854Da00d8F699Ead0FB1dbb3a12fA76504Ebb2EB";

export const supportedChains = [chain.goerli];

export const chainIdToRPC = {
  [chain.goerli.id]: process.env.NEXT_PUBLIC_GOERLI_RPC_URL,
  // [chain.polygonMumbai.id]: process.env.NEXT_PUBLIC_MUMBAI_RPC_URL,
};
