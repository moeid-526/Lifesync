import Web3 from "web3";

const web3 = new Web3("http://localhost:8545");

const accounts = await web3.eth.getAccounts();
const backendAccount = accounts[0];

const balance = await web3.eth.getBalance(backendAccount);
console.log(`Backend account: ${backendAccount}`);
console.log(`Balance: ${web3.utils.fromWei(balance, "ether")} ETH`);
