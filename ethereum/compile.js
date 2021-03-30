const path = require("path");
const fs = require("fs-extra"); //File system helpers
const solc = require("solc");

const buildPath = path.resolve(__dirname, "build"); //get path of build folder
fs.removeSync(buildPath); //Delete the build folder itself

const campainPath = path.resolve(__dirname, "contracts", "Campaign.sol"); //get path for the campaign.sol file
const source = fs.readFileSync(campainPath, "utf8"); //extract the source code from the campaign.sol file

const input = {
  language: "Solidity",
  sources: {},
  settings: {
    outputSelection: {
      "*": {
        "*": ["*"],
      },
    },
  },
};
input.sources["Campaign.sol"] = {
  content: source,
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));
const contracts = output.contracts["Campaign.sol"];

//Re-create the build folder
fs.ensureDirSync(buildPath); //checks if a folder exists and if not, creates it

// Extract and write the JSON representations of the contracts to the build folder
//the contract property will be present for each contract in the source code file. We are extracting each contract and creating the individual JSON files
for (let contract in contracts) {
  if (contracts.hasOwnProperty(contract)) {
    fs.outputJsonSync(
      path.resolve(buildPath, `${contract}.json`),
      contracts[contract]
    );
  }
}
