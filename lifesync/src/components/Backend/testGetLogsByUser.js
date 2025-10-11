import fs from "fs";
import Web3 from "web3";
import path from "path";
import { fileURLToPath } from "url";

// Required for __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Construct correct absolute paths
const buildPath = path.join(__dirname, "Contracts", "build");

const contractData = JSON.parse(fs.readFileSync(path.join(buildPath, "SystemLogs.json"), "utf-8"));
const deployedData = JSON.parse(fs.readFileSync(path.join(buildPath, "deployed.json"), "utf-8"));
const contractAddress = deployedData.address;

// 2. Initialize web3
const web3 = new Web3("http://127.0.0.1:7545"); // your Ganache endpoint

// 3. Create contract instance
const contract = new web3.eth.Contract(contractData.abi, contractAddress);

// Firebase UID (this must match what was passed to addLog)
const firebaseUID = "F6CR3sAxJGNMPo6exROF1U4lOt43";

async function test() {
  try {
    console.log(`🧪 Checking total logs...`);
    const totalLogs = await contract.methods.getTotalLogs().call();
    console.log(`📦 Total logs in system: ${totalLogs}`);

    if (totalLogs == 0) {
      console.warn("⚠️ No logs exist in the contract. Try adding some logs first.");
      return;
    }

    // Check a sample log to verify access
    const sampleLog = await contract.methods.logs(0).call();
    console.log(`🔍 Sample log[0]:`, sampleLog);

    console.log(`🔎 Now fetching logs for UID: ${firebaseUID}...`);
    const [userIds, messages, timestamps] = await contract.methods.getLogsByUser(firebaseUID).call();

    console.log(`🧾 Logs for user ${firebaseUID}:`);
    for (let i = 0; i < userIds.length; i++) {
      console.log(`➡️ ${timestamps[i]} | ${userIds[i]} | ${messages[i]}`);
    }
  } catch (err) {
    console.error("❌ Error fetching logs:", err.message);
  }
}

test();
