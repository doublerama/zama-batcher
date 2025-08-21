import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async ({ deployments, getNamedAccounts }) => {
  const { deploy, log, execute } = deployments;
  const { deployer } = await getNamedAccounts();

  const UNISWAP_ROUTER = process.env.UNISWAP_ROUTER;
  const USDC = process.env.USDC;
  const WETH = process.env.WETH;
  const POOL_FEE = Number(process.env.POOL_FEE || "3000"); // 0.3% by default

  // 1) Registry
  const reg = await deploy("FHEIntentRegistry", { from: deployer, log: true, args: [] });

  // 2) Batcher
  await deploy("DCABatcher", { from: deployer, log: true, args: [reg.address] });

  // 3) DEX adapter
  await deploy("DexAdapterUniswap", { from: deployer, log: true, args: [] });

  // Wire adapter to batcher
  await execute("DCABatcher", { from: deployer, log: true }, "setDexAdapter", (await deployments.get("DexAdapterUniswap")).address);

  // Optionally configure adapter
  if (UNISWAP_ROUTER && USDC && WETH) {
    await execute(
      "DexAdapterUniswap",
      { from: deployer, log: true },
      "configure",
      UNISWAP_ROUTER,
      USDC,
      WETH,
      POOL_FEE
    );
    log(`DexAdapter configured (router=${UNISWAP_ROUTER}, USDC=${USDC}, WETH=${WETH}, fee=${POOL_FEE})`);
  } else {
    log("DexAdapter left unconfigured (no env provided).");
  }
};
export default func;
func.tags = ["core"];
