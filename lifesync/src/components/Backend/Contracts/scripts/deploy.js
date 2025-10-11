const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const { formatEther } = require("ethers");

async function main() {
  console.log("🚀 Deploying SystemLogs contract...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📨 Using deployer account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", formatEther(balance));

  const SystemLogs = await hre.ethers.getContractFactory("SystemLogs");
  const contract = await SystemLogs.deploy();

  await contract.waitForDeployment(); // <-- ✅ modern method replacing .deployed()
  const address = await contract.getAddress(); // <-- ✅ modern way to get address
  console.log("✅ Contract deployed at:", address);

  const contractData = {
    address: address,
    abi: JSON.parse(contract.interface.formatJson())
  };

  const buildDir = path.resolve(__dirname, "..", "build");
  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir);
  }

  fs.writeFileSync(
    path.join(buildDir, "deployed.json"),
    JSON.stringify(contractData, null, 2)
  );
  console.log("📦 Contract info saved to: build/deployed.json");
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
