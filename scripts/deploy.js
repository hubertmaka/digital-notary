const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const adminAddress = process.env.ADMIN_ADDRESS || deployer.address;

  console.log("Network:       ", hre.network.name);
  console.log("Deployer:      ", deployer.address);
  console.log("Admin:         ", adminAddress);

  const DigitalNotary = await hre.ethers.getContractFactory("DigitalNotary");
  const notary = await DigitalNotary.deploy(adminAddress);
  await notary.waitForDeployment();

  const address = await notary.getAddress();
  console.log("\nDigitalNotary deployed at:", address);

  if (adminAddress === deployer.address) {
    const tx = await notary.addNotary(deployer.address);
    await tx.wait();
    console.log("Notary role granted to:", deployer.address);
  }

  console.log("\nNext steps:");
  console.log("1. Set CONTRACT_ADDRESS in frontend/src/config.js");
  if (hre.network.name === "sepolia") {
    console.log("2. Optional Etherscan verification:");
    console.log(`   npx hardhat verify --network sepolia ${address} ${adminAddress}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
