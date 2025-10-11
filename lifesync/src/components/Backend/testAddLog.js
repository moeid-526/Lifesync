// testLogsCount.js
import Web3 from "web3";
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// Setup for __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load ABI and contract address
const deployed = JSON.parse(
  await readFile(path.join(__dirname, "Contracts/build/deployed.json"), "utf8")
);

const abi = deployed.abi;
const contractAddress = deployed.address;

// Setup web3
const web3 = new Web3("http://localhost:7545");

// Create contract instance
const contract = new web3.eth.Contract(abi, contractAddress);

try {
  const totalLogs = await contract.methods.getTotalLogs().call();
  console.log(`📝 Total logs stored on-chain: ${totalLogs}`);
} catch (err) {
  console.error("❌ Failed to fetch total logs:", err.message);
}
