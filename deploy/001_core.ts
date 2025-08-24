import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, ethers } = hre;
  const { deploy, execute, log } = deployments;

  const { deployer } = await getNamedAccounts();

  const ROUTER = process.env.UNISWAP_ROUTER || "";
  const WETH = process.env.WETH || "";
  const POOL_FEE = Number(process.env.POOL_FEE || "3000"); // 0.3%

  if (!ROUTER || !WETH) {
    throw new Error("Missing UNISWAP_ROUTER or WETH env vars");
  }

  log("Deploying FHEIntentRegistry...");
  const reg = await deploy("FHEIntentRegistry", {
    from: deployer,
    args: [],
    log: true,
    skipIfAlreadyDeployed: true,
  });

  log("Deploying DexAdapterUniswap...");
  const adapter = await deploy("DexAdapterUniswap", {
    from: deployer,
    args: [],
    log: true,
    skipIfAlreadyDeployed: true,
  });

  log("Configuring DexAdapterUniswap...");
  await execute(
    "DexAdapterUniswap",
    { from: deployer, log: true },
    "configure",
    ROUTER,
    (await ethers.getAddress(WETH)),
    (await ethers.getAddress(WETH)), // if adapter expects usdc, pass placeholder or real USDC when available
    POOL_FEE
  );

  log("Deploying DCABatcher...");
  // tune kTarget (batch size) & dtSeconds (time fallback) as needed
  const kTarget = 10;
  const dtSeconds = 60;
  const batcher = await deploy("DCABatcher", {
    from: deployer,
    args: [reg.address, adapter.address, kTarget, dtSeconds],
    log: true,
    skipIfAlreadyDeployed: true,
  });

  log("Deployment summary:");
  log(`FHEIntentRegistry: ${reg.address}`);
  log(`DexAdapterUniswap: ${adapter.address}`);
  log(`DCABatcher:       ${batcher.address}`);
};

export default func;
func.tags = ["sepolia"];
