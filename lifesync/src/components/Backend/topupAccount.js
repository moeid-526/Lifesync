import Web3 from "web3";

const web3 = new Web3("http://localhost:8545");

const accounts = await web3.eth.getAccounts();
const backendAccount = accounts[0];
const funderAccount = accounts[1]; // Ganache always starts with many rich accounts

console.log(`⛽ Funding backend account ${backendAccount} from ${funderAccount}...`);

const tx = await web3.eth.sendTransaction({
  from: funderAccount,
  to: backendAccount,
  value: web3.utils.toWei("1000", "ether") // 1000 ETH
});

console.log(`✅ Top-up complete! TX Hash: ${tx.transactionHash}`);

const balance = await web3.eth.getBalance(backendAccount);
console.log(`💰 New balance: ${web3.utils.fromWei(balance, "ether")} ETH`);
