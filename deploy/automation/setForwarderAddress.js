const { ethers } = require("ethers");
require("dotenv").config();

async function setForwarderAddress() {
  const { PRIVATE_KEY, RPC_URL, CONTRACT_ADDRESS, ADMIN_ADDRESS } = process.env;

  if (!PRIVATE_KEY || !RPC_URL || !CONTRACT_ADDRESS) {
    console.error("Missing required environment variables");
    process.exit(1);
  }

  const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  // Contract ABI for setForwarderAddress function
  const contractABI = [
    "function setForwarderAddress(address forwarderAddress) external",
  ];

  const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, wallet);

  // Set forwarder address to admin address temporarily
  const forwarderAddress = ADMIN_ADDRESS;

  try {
    console.log(`Setting forwarder address to: ${forwarderAddress}`);
    const tx = await contract.setForwarderAddress(forwarderAddress);
    console.log("Transaction sent:", tx.hash);

    const receipt = await tx.wait();
    console.log("Transaction confirmed in block:", receipt.blockNumber);
    console.log("✅ Forwarder address set successfully");
  } catch (error) {
    console.error("❌ Failed to set forwarder address:", error);
    process.exit(1);
  }
}

setForwarderAddress();
