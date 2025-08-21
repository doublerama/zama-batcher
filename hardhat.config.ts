import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-deploy";
import * as dotenv from "dotenv";
dotenv.config();

const RPC_URL_SEPOLIA = process.env.RPC_URL_SEPOLIA || "";
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || "0x" + "0"*64;

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: { optimizer: { enabled: true, runs: 200 } }
  },
  namedAccounts: { deployer: { default: 0 } },
  networks: {
    sepolia: {
      url: RPC_URL_SEPOLIA,
      accounts: DEPLOYER_PRIVATE_KEY ? [DEPLOYER_PRIVATE_KEY] : []
    }
  }
};
export default config;