import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Contract, ethers } from "ethers";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, ethers: hhEthers } = hre;
  const { deploy, execute, log, getArtifact } = deployments;
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

  // Try to configure adapter (signature-safe)
  try {
    const adapterArt = await getArtifact("DexAdapterUniswap");
    const conf = (adapterArt.abi as any[]).find(
      (x) => x.type === "function" && x.name === "configure"
    );
    const inputs = conf?.inputs?.length ?? 0;

    log(`Configuring DexAdapterUniswap (inputs=${inputs})...`);
    if (inputs === 4) {
      await execute(
        "DexAdapterUniswap",
        { from: deployer, log: true },
        "configure",
        ROUTER,
        WETH,
        WETH, // placeholder for USDC if your adapter expects (router, usdc, weth, fee)
        POOL_FEE
      );
    } else if (inputs === 3) {
      await execute(
        "DexAdapterUniswap",
        { from: deployer, log: true },
        "configure",
        ROUTER,
        WETH,
        POOL_FEE
      );
    } else if (inputs === 2) {
      await execute(
        "DexAdapterUniswap",
        { from: deployer, log: true },
        "configure",
        ROUTER,
        WETH
      );
    } else {
      log("configure() not found or unexpected signature, skipping adapter configure.");
    }
  } catch (e) {
    log(`Adapter configure skipped: ${(e as Error).message}`);
  }

  // Batch params we prefer by default
  const kTarget = 10;
  const dtSeconds = 60;

  // Deploy DCABatcher with constructor-args auto-detection
  const batcherArt = await getArtifact("DCABatcher");
  const ctor = (batcherArt.abi as any[]).find((x) => x.type === "constructor");
  const n = ctor?.inputs?.length ?? 0;

  let batcherArgs: any[] = [];
  if (n === 4) {
    batcherArgs = [reg.address, adapter.address, kTarget, dtSeconds];
  } else if (n === 3) {
    batcherArgs = [reg.address, adapter.address, kTarget];
  } else if (n === 2) {
    batcherArgs = [reg.address, adapter.address];
  } else if (n === 1) {
    batcherArgs = [reg.address];
  } else {
    batcherArgs = [];
  }

  log(`Deploying DCABatcher with ${n} constructor arg(s)...`);
  const batcher = await deploy("DCABatcher", {
    from: deployer,
    args: batcherArgs,
    log: true,
    skipIfAlreadyDeployed: true,
  });

  // Try to set batch params via function if constructor didn't take them
  try {
    if (n < 4) {
      // attach as deployer
      const signer = await hhEthers.getSigner(deployer);
      const contract = new Contract(batcher.address, batcherArt.abi, signer) as any;

      if (typeof contract.setBatchParams === "function") {
        log("Calling setBatchParams(kTarget, dtSeconds)...");
        const tx = await contract.setBatchParams(kTarget, dtSeconds);
        await tx.wait();
      } else if (typeof contract.configureBatch === "function") {
        log("Calling configureBatch(kTarget, dtSeconds)...");
        const tx = await contract.configureBatch(kTarget, dtSeconds);
        await tx.wait();
      } else {
        log("No batch params setter found, skipping.");
      }
    }
  } catch (e) {
    log(`Setting batch params skipped: ${(e as Error).message}`);
  }

  log("Deployment summary:");
  log(`FHEIntentRegistry: ${reg.address}`);
  log(`DexAdapterUniswap: ${adapter.address}`);
  log(`DCABatcher:       ${batcher.address}`);
};

export default func;
func.tags = ["sepolia"];
