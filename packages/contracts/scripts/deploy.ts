import { artifacts, ethers, network } from "hardhat";
import fs from "node:fs";
import path from "node:path";

async function main() {
  const [deployer] = await ethers.getSigners();
  const arena = await ethers.deployContract("TweetBattleArena", [
    deployer.address,
  ]);
  await arena.waitForDeployment();
  const address = await arena.getAddress();
  const artifact = await artifacts.readArtifact("TweetBattleArena");
  const generatedDir = path.resolve(__dirname, "../../shared/src/generated");

  fs.mkdirSync(generatedDir, { recursive: true });
  fs.writeFileSync(
    path.join(generatedDir, "TweetBattleArena.json"),
    JSON.stringify({ address, abi: artifact.abi }, null, 2),
  );
  fs.writeFileSync(
    path.join(generatedDir, "deployment.json"),
    JSON.stringify(
      { network: network.name, chainId: network.config.chainId, address },
      null,
      2,
    ),
  );

  console.log(`TweetBattleArena deployed to ${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
