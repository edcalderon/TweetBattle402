import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";
import { HardhatUserConfig } from "hardhat/config";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      viaIR: true,
    },
  },
  networks: {
    monadTestnet: {
      url:
        process.env.NEXT_PUBLIC_MONAD_RPC_URL ??
        "https://testnet-rpc.monad.xyz",
      chainId: Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 10143),
      accounts: process.env.RESOLVER_PRIVATE_KEY
        ? [process.env.RESOLVER_PRIVATE_KEY]
        : [],
    },
  },
};

export default config;
