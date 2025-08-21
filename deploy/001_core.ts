import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async ({ deployments, getNamedAccounts }) => {
  const { deploy, log, execute } = deployments;
  const { deployer } = await getNamedAccounts();

  const UNISWAP_ROUTER = process.env.UNISWAP_ROUTER;
  const USDC = process.env.USDC;
  const WETH = process.env.WETH;
  const POOL_FEE = Number(process.env.POOL_FEE || "3000"); // 0.3%

  // 1) Registry
  const reg = await deploy("FHEIntentRegistry", { from: deployer, log: true, args: [] });

  // 2) Batcher
  const batcher = await deploy("DCABatcher", { from: deployer, log: true, args: [reg.address] });

  // 3) Adapter: real Uniswap if env is provided; otherwise fall back to mocks.
  if (UNISWAP_ROUTER && USDC && WETH) {
    const adapter = await deploy("DexAdapterUniswap", { from: deployer, log: true, args: [] });
    await execute("DCABatcher", { from: deployer, log: true }, "setDexAdapter", adapter.address);
    await execute("DexAdapterUniswap", { from: deployer, log: true }, "setBatcher", batcher.address);
    await execute("DexAdapterUniswap", { from: deployer, log: true }, "configure", UNISWAP_ROUTER, USDC, WETH, POOL_FEE);
    log(`DexAdapter configured (router=${UNISWAP_ROUTER}, USDC=${USDC}, WETH=${WETH})`);
  } else {
    const usdc = await deploy("MockERC20", { from: deployer, log: true, args: ["Mock USDC", "mUSDC", 6] });
    const weth = await deploy("MockERC20", { from: deployer, log: true, args: ["Mock WETH", "mWETH", 18] });
    const adapter = await deploy("MockAdapter", { from: deployer, log: true, args: [] });

    await execute("DCABatcher", { from: deployer, log: true }, "setDexAdapter", adapter.address);
    await execute("MockAdapter", { from: deployer, log: true }, "setBatcher", batcher.address);
    await execute("MockAdapter", { from: deployer, log: true }, "configure", usdc.address, weth.address);
    log(`Using mocks: usdc=${usdc.address}, weth=${weth.address}, adapter=${adapter.address}`);
  }
};
export default func;
func.tags = ["core"];
