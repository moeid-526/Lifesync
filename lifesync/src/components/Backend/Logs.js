// Logs.js
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import admin from "firebase-admin";
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import Web3 from "web3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5011;

app.use(cors());
app.use(bodyParser.json());

// Firebase Admin Init
const serviceAccount = JSON.parse(
  await readFile(path.join(__dirname, "firebase-adminsdk.json"), "utf8")
);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Load deployed contract
const deployed = JSON.parse(
  await readFile(path.join(__dirname, "Contracts/build/deployed.json"), "utf8")
);
const abi = deployed.abi;
const contractAddress = deployed.address;

// Web3 & Contract Init
const web3 = new Web3("http://localhost:8545");
const contract = new web3.eth.Contract(abi, contractAddress);
const accounts = await web3.eth.getAccounts();
const backendAccount = accounts[0];

console.log(`🧠 Using backend account: ${backendAccount}`);
console.log(`📜 Smart contract at: ${contractAddress}`);

import { exec } from "child_process";

// --- Auto balance monitor ---
async function checkAndRunResetScript() {
  try {
    const balanceWei = await web3.eth.getBalance(backendAccount);
    const balanceEth = Number(web3.utils.fromWei(balanceWei, "ether"));

    if (balanceEth < 50) {
      console.log(`⚠️ Low balance detected (${balanceEth} ETH). Running resetBalance.js...`);
      exec(`node ${path.join(__dirname, "resetBalance.js")}`, (err, stdout, stderr) => {
        if (err) {
          console.error("❌ Failed to run resetBalance.js:", err);
          return;
        }
        console.log(stdout);
        if (stderr) console.error(stderr);
      });
    } else {
      console.log(`💰 Current balance: ${balanceEth} ETH`);
    }
  } catch (err) {
    console.error("❌ Error checking balance:", err);
  }
}

// ✅ Check immediately at startup
await checkAndRunResetScript();

// 🔄 Check every 10 minutes
setInterval(checkAndRunResetScript, 10 * 60 * 1000);


// Firebase token middleware
async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const idToken = authHeader.split(" ")[1];
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid token" });
  }
}

// ➤ POST /api/log - Add log to smart contract
app.post("/api/log", verifyToken, async (req, res) => {
  const { message } = req.body;
  const userId = req.user.uid;

  console.log(`📥 Log request: user ${userId}, message: ${message}`);

  try {
    const gasEstimate = await contract.methods
      .addLog(userId, message)
      .estimateGas({ from: backendAccount });

    const receipt = await contract.methods
      .addLog(userId, message)
      .send({
        from: backendAccount,
        gas: Math.floor(Number(gasEstimate) * 1.3),
      });

    console.log(
      `📦 Log stored: "${message}" at block ${receipt.blockNumber}, gas used: ${receipt.gasUsed}`
    );

    res.status(200).json({
      message: "Log added to blockchain",
      txHash: receipt.transactionHash,
    });
  } catch (err) {
    console.error("❌ Store log error:", err);
    res.status(500).json({ error: "Failed to store log", details: err.message });
  }
});

// ➤ GET /api/logs - Fetch logs for current user
app.get("/api/logs", verifyToken, async (req, res) => {
  const userId = req.user.uid;
  console.log(`📤 Fetching logs for user ${userId}`);

  try {
    const rawLogs = await contract.methods.getLogsByUser(userId).call();

    const formattedLogs = rawLogs
      .map((logStr) => {
        try {
          return JSON.parse(logStr);
        } catch (err) {
          console.warn("⚠️ Invalid log JSON:", logStr);
          return null;
        }
      })
      .filter(Boolean)
      .sort((a, b) => b.timestamp - a.timestamp); // ✅ Newest first

    console.log(`✅ Retrieved ${formattedLogs.length} logs`);
    res.status(200).json(formattedLogs);
  } catch (err) {
    console.error("❌ Fetch logs error:", err.message);
    res.status(500).json({ error: "Failed to fetch logs" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Logs backend running at http://localhost:${PORT}`);
});
