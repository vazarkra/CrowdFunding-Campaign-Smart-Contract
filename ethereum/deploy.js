//Code for connecting to the Rinkeby network via the Infura API using the Truffle provider
const HDWalletProvider = require("truffle-hdwallet-provider");
const Web3 = require("web3");
const compiledFactory = require("./build/CampaignFactory.json");
const provider = new HDWalletProvider(
  "shove debris island civil industry reopen frown frog left morning file harbor",
  "https://rinkeby.infura.io/v3/7a2d89139fc5469b860422c3afe42c5a"
);
const web3 = new Web3(provider);

const deploy = async () => {
  const accountList = await web3.eth.getAccounts();
  console.log("Attempting to deploy from account :", accountList[0]);
  const result = await new web3.eth.Contract(compiledFactory.abi) //tells what methods the inbox contract has
    .deploy({ data: "0x" + compiledFactory.evm.bytecode.object }) //tells we want to deploy an instance
    .send({ from: accountList[0], gas: "1500000" }); //sends a transactions to create the contract
  console.log("Contract deployed to address: ", result.options.address);
};
deploy();
