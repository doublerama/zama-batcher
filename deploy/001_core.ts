import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async ({ deployments, getNamedAccounts }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  await deploy("FHEIntentRegistry", { from: deployer, log: true, args: [] });
  await deploy("DCABatcher", { from: deployer, log: true, args: [] });
  await deploy("DexAdapterUniswap", { from: deployer, log: true, args: [] });
};
export default func;
func.tags = ["core"];