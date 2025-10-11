// checkOwner.js
import Web3 from "web3";
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load deployed contract info
const deployedPath = path.join(__dirname, "Contracts/build/deployed.json");
const deployed = JSON.parse(await readFile(deployedPath, "utf8"));

const abi = deployed.abi;
const contractAddress = deployed.address;

const web3 = new Web3("http://localhost:7545");
const contract = new web3.eth.Contract(abi, contractAddress);

const accounts = await web3.eth.getAccounts();
const backendAccount = accounts[0];

console.log(`🧠 Using backend account: ${backendAccount}`);
console.log(`📜 Smart contract at: ${contractAddress}`);

// Just check that the contract exists and can respond to getTotalLogs
try {
  const totalLogs = await contract.methods.getTotalLogs().call();
  console.log(`📊 Total logs in contract: ${totalLogs}`);
} catch (err) {
  console.error("❌ Error communicating with contract:", err.message);
}
