require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const { SEPOLIA_RPC_URL, PRIVATE_KEY, ETHERSCAN_API_KEY } = process.env;

/** @type import('hardhat/config').HardhatUserConfig */
const config = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    hardhat: {},
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY || "",
  },
};

// Sieć Sepolia dodawana tylko, gdy skonfigurowano zmienne środowiskowe (.env)
if (SEPOLIA_RPC_URL && PRIVATE_KEY) {
  config.networks.sepolia = {
    url: SEPOLIA_RPC_URL,
    accounts: [PRIVATE_KEY],
    chainId: 11155111,
  };
}

module.exports = config;
