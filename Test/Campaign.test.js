const assert = require("assert");
const ganache = require("ganache-cli");
const Web3 = require("web3");
const provider = ganache.provider();
const web3 = new Web3(provider);

const compiledFactory = require("../ethereum/build/CampaignFactory.json");
const compiledCampaign = require("../ethereum/build/Campaign.json");

let accounts;
let factory;
let campaignAddress;
let campaign;

beforeEach(async () => {
  accounts = await web3.eth.getAccounts();
  //Deploy the factory contract
  factory = await new web3.eth.Contract(compiledFactory.abi)
    .deploy({ data: "0x" + compiledFactory.evm.bytecode.object })
    .send({ from: accounts[0], gas: "1500000" });

  //Create instance of a campaign using the factory
  await factory.methods
    .createCampaign("0")
    .send({ from: accounts[0], gas: "1500000" });

  //get deployed campaign contract address
  [campaignAddress] = await factory.methods.getDeployedCampaigns().call();

  //create new instance of the contract locally using deployed address
  campaign = await new web3.eth.Contract(compiledCampaign.abi, campaignAddress);
});

describe("Test Campaigns Contract", () => {
  it("Factory and Campaigns Deployed", () => {
    assert.ok(factory.options.address);
    assert.ok(campaign.options.address);
  });

  it("Caller marked as campaign manager", async () => {
    assert.strictEqual(accounts[0], await campaign.methods.manager().call());
  });

  it("Donate money to the campaign and become an approver", async () => {
    await campaign.methods.contribute().send({ from: accounts[1], value: "1" });
    //Approvers is a mapping which will return true if the key exists
    assert(await campaign.methods.approvers(accounts[1]).call());
  });

  it("Should not be able to contribute less than minimum", async () => {
    try {
      await campaign.methods
        .contribute()
        .send({ from: accounts[2], value: "10" });
      assert(false); //this line of code should not be executed
    } catch (err) {
      assert(err);
    }
  });

  it("Manager is able to create a payment request", async () => {
    await campaign.methods
      .createRequest("Test Request", "50", accounts[1])
      .send({ from: accounts[0], gas: "1500000" });
    const request = await campaign.methods.requests("0").call();
    assert.strictEqual("Test Request", request.description);
  });

  it("End to End Test", async () => {
    //Contribute
    await campaign.methods
      .contribute()
      .send({ from: accounts[1], value: web3.utils.toWei("10", "ether") });
    //Create Request
    await campaign.methods
      .createRequest("Pay Vendor", web3.utils.toWei("5", "ether"), accounts[2])
      .send({ from: accounts[0], gas: "1500000" });
    //Approve Request
    await campaign.methods
      .approveRequest("0")
      .send({ from: accounts[1], gas: "1500000" });
    //Get bal of receipient before request is finalized
    const initialBal = await web3.eth.getBalance(accounts[2]);
    console.log(initialBal);
    //Finalize request and initiate payout of 1 ether to account 2
    await campaign.methods
      .finalizeRequest("0")
      .send({ from: accounts[0], gas: "1500000" });
    //Get final balance after request is finalized
    const finalBal = await web3.eth.getBalance(accounts[2]);
    console.log(finalBal);
    assert(parseFloat(finalBal) > parseFloat(initialBal)); //getBalance returns string and parseFloat will convert it into decimal
  });
});
