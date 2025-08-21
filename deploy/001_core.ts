import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async ({ deployments, getNamedAccounts }) => {
  const { deploy, log, execute } = deployments;
  const { deployer } = await getNamedAccounts();

  const UNISWAP_ROUTER = process.env.UNISWAP_ROUTER;
  const USDC = process.env.USDC;
  const WETH = process.env.WETH;

  // 1) Registry
  const reg = await deploy("FHEIntentRegistry", { from: deployer, log: true, args: [] });

  // 2) Batcher (needs the registry address)
  const batcher = await deploy("DCABatcher", { from: deployer, log: true, args: [reg.address] });

  // 3) DEX adapter
  const adapter = await deploy("DexAdapterUniswap", { from: deployer, log: true, args: [] });

  // Wire adapter to batcher
  await execute("DCABatcher", { from: deployer, log: true }, "setDexAdapter", adapter.address);

  // Optionally configure adapter if env addresses are present
  if (UNISWAP_ROUTER && USDC && WETH) {
    await execute("DexAdapterUniswap", { from: deployer, log: true }, "configure", UNISWAP_ROUTER, USDC, WETH);
    log(`DexAdapter configured with router=${UNISWAP_ROUTER}, USDC=${USDC}, WETH=${WETH}`);
  } else {
    log("DexAdapter left unconfigured (no env provided).");
  }
};
export default func;
func.tags = ["core"];
