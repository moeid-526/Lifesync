import Web3 from "web3";

const web3 = new Web3("http://localhost:8545");

// The backend account to fund
const accounts = await web3.eth.getAccounts();
const backendAccount = accounts[0];

const targetBalance = "0x3635c9adc5dea00000"; // 1000 ETH in hex

console.log(`💰 Resetting balance for ${backendAccount} to 1000 ETH...`);

await new Promise((resolve, reject) => {
  web3.currentProvider.send(
    {
      jsonrpc: "2.0",
      method: "evm_setAccountBalance",
      params: [backendAccount, targetBalance],
      id: 1,
    },
    (err, res) => {
      if (err) reject(err);
      else resolve(res);
    }
  );
});

const balance = await web3.eth.getBalance(backendAccount);
console.log(`✅ New balance: ${web3.utils.fromWei(balance, "ether")} ETH`);
