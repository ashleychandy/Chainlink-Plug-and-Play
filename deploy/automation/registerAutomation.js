
/**
 * Chainlink Automation Registration Script
 * Handles upkeep registration and forwarder address extraction
 */

const { ethers } = require("ethers");
const axios = require("axios");
const { logError, logInfo, logSuccess, logWarn } = require("../helpers/log");
const { updateEnvFile, loadEnvFile, getEnvVar, generateUpkeepName } = require("../helpers/updateEnvFile");

// Load environment variables
loadEnvFile();

/**
 * Transfer LINK tokens and register upkeep via transferAndCall
 * @param {Object} params - Registration parameters
 * @param {string} params.LINK_TOKEN_ADDRESS - LINK token contract address
 * @param {string} params.REGISTRAR - Automation registrar address
 * @param {string} params.LINK_AMOUNT - Amount of LINK to transfer
 * @param {string} params.PRIVATE_KEY - Private key for signing
 * @param {string} params.RPC_URL - RPC endpoint URL
 * @param {string} params.UPKEEP_NAME - Name for the upkeep
 * @param {string} params.CONTRACT_ADDRESS - Contract to register for automation
 * @param {string} params.GAS_LIMIT - Gas limit for upkeep execution
 * @param {string} params.ADMIN - Admin address for the upkeep
 * @param {string} params.TRIGGER_TYPE - Type of trigger (0=custom, 1=time-based)
 * @returns {Promise<string>} Transaction hash
 */
async function transferAndRegisterUpkeep({
  LINK_TOKEN_ADDRESS,
  REGISTRAR,
  LINK_AMOUNT,
  PRIVATE_KEY,
  RPC_URL,
  UPKEEP_NAME,
  CONTRACT_ADDRESS,
  GAS_LIMIT,
  ADMIN,
  TRIGGER_TYPE,
}) {
  logInfo("==== Registering and Funding Upkeep via transferAndCall ====");
  const paramsStruct = {
    name: UPKEEP_NAME,
    encryptedEmail: "0x",
    upkeepContract: CONTRACT_ADDRESS,
    gasLimit: GAS_LIMIT,
    adminAddress: ADMIN,
    triggerType: TRIGGER_TYPE,
    checkData: "0x",
    triggerConfig: "0x",
    offchainConfig: "0x",
    amount: LINK_AMOUNT,
    sender: ADMIN,
  };
  const structTypes = [
    "string", "bytes", "address", "uint32", "address", "uint8", "bytes", "bytes", "bytes", "uint96", "address"
  ];
  const structValues = Object.values(paramsStruct);
  const abiCoder = ethers.AbiCoder.defaultAbiCoder();
  const encodedStruct = abiCoder.encode(structTypes, structValues);
  const functionSelector = "0x856853e6";
  const encoded = functionSelector + encodedStruct.slice(2);
  logInfo("Encoded registerUpkeep data:", encoded);
  const linkIface = new ethers.Interface(["function transferAndCall(address,uint256,bytes)"]);
  const data = linkIface.encodeFunctionData("transferAndCall", [REGISTRAR, LINK_AMOUNT, encoded]);
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const tx = { to: LINK_TOKEN_ADDRESS, data, value: 0 };
  try {
    const sentTx = await wallet.sendTransaction(tx);
    logSuccess("Transaction sent! Hash:", sentTx.hash);
    const receipt = await sentTx.wait();
    logSuccess("Transaction confirmed! Block:", receipt.blockNumber);
    return sentTx.hash;
  } catch (error) {
    logError("transferAndCall failed:", error);
    return null;
  }
}


async function signAutomationMessage(walletAddress, registrarAddress, registrationHash) {
  const PRIVATE_KEY = process.env.PRIVATE_KEY;
  const wallet = new ethers.Wallet(PRIVATE_KEY);
  const message = `Welcome to Chainlink Automation!\nWe require a signature in order to ensure you are the owner of the upkeep.\n\nWallet address:\n${walletAddress}\nRegistrar address:\n${registrarAddress}\nUpkeep registration hash:\n${registrationHash}`;
  const signature = await wallet.signMessage(message);
  logInfo("Signature for Chainlink Automation registration:");
  logInfo(signature);
  return signature;
}


async function setForwarderAddress(contractAddress, forwarderAddress, privateKey, rpcUrl) {
  logInfo("==== Setting Forwarder Address ====");
  logInfo(`Contract: ${contractAddress}`);
  logInfo(`Forwarder: ${forwarderAddress}`);
  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    const contractABI = [
      "function setForwarderAddress(address forwarderAddress) public",
      "event ForwarderAddressUpdated(address indexed oldForwarder, address indexed newForwarder)",
    ];
    const contract = new ethers.Contract(contractAddress, contractABI, wallet);
    const gasEstimate = await contract.setForwarderAddress.estimateGas(forwarderAddress);
    logInfo(`Gas estimate: ${gasEstimate.toString()}`);
    const tx = await contract.setForwarderAddress(forwarderAddress, {
      gasLimit: (gasEstimate * 120n) / 100n,
    });
    logSuccess(`Transaction sent! Hash: ${tx.hash}`);
    logInfo(`Waiting for confirmation...`);
    const receipt = await tx.wait();
    logSuccess(`Transaction confirmed! Block: ${receipt.blockNumber}`);
    const eventFilter = contract.filters.ForwarderAddressUpdated();
    const events = await contract.queryFilter(eventFilter, receipt.blockNumber, receipt.blockNumber);
    if (events.length > 0) {
      const event = events[0];
      logSuccess(`ForwarderAddressUpdated event emitted:`);
      logInfo(`  Old forwarder: ${event.args.oldForwarder}`);
      logInfo(`  New forwarder: ${event.args.newForwarder}`);
    }
    return tx.hash;
  } catch (error) {
    logError(`Error setting forwarder address:`, error.message);
    if (error.reason) logError(`Reason: ${error.reason}`);
    throw error;
  }
}


async function saveForwarderFromTx(txHash, envVarName = "AUTOMATION_FORWARDER_ADDRESS") {
  const apiKey = process.env.ETHERSCAN_API_KEY;
  if (!apiKey) {
    logError("ETHERSCAN_API_KEY not set in .env");
    process.exit(1);
  }
  const url = `https://api.etherscan.io/v2/api?chainid=421614&module=account&action=txlistinternal&txhash=${txHash}&apikey=${apiKey}`;
  try {
    const resp = await axios.get(url);
    if (resp.data.status !== "1") {
      logError("API error:", resp.data.message);
      process.exit(1);
    }
    if (!resp.data.result || resp.data.result.length === 0) {
      logError("No contract creation found in transaction receipt.");
      process.exit(1);
    }
    const contractCreation = resp.data.result.find(tx => tx.type === "create");
    if (!contractCreation || !contractCreation.contractAddress) {
      logError("No contract creation found in transaction receipt.");
      process.exit(1);
    }
    const contractAddress = contractCreation.contractAddress;
    updateEnvFile(envVarName, contractAddress);
    logSuccess(`Saved ${envVarName}=${contractAddress} to .env`);
    return contractAddress;
  } catch (err) {
    logError("Error fetching from Etherscan API:", err.message);
    process.exit(1);
  }
}


async function fetchForwarderFromSpecificTx(txHash, envVarName = "AUTOMATION_FORWARDER_ADDRESS") {
  const apiKey = process.env.ETHERSCAN_API_KEY;
  const url = `https://api.etherscan.io/v2/api?chainid=421614&module=account&action=txlistinternal&txhash=${txHash}&apikey=${apiKey}`;
  try {
    logInfo(`Fetching forwarder address for tx: ${txHash}`);
    const resp = await axios.get(url);
    if (resp.data.status !== "1") {
      logError("API error:", resp.data.message);
      return null;
    }
    if (!resp.data.result || resp.data.result.length === 0) {
      logError("No internal transactions found for this transaction hash.");
      return null;
    }
    const contractCreation = resp.data.result.find(tx => tx.type === "create");
    if (!contractCreation || !contractCreation.contractAddress) {
      logError("No contract creation found in internal transactions.");
      return null;
    }
    const forwarderAddress = contractCreation.contractAddress;
    logSuccess(`Found forwarder address: ${forwarderAddress}`);
    updateEnvFile(envVarName, forwarderAddress);
    logSuccess(`Saved ${envVarName}=${forwarderAddress} to .env`);
    const contractAddress = process.env.CONTRACT_ADDRESS;
    const privateKey = process.env.PRIVATE_KEY;
    const rpcUrl = process.env.RPC_URL;
    if (contractAddress && privateKey && rpcUrl) {
      try {
        logInfo(`==== Setting Forwarder Address in Contract ====`);
        const setTxHash = await setForwarderAddress(contractAddress, forwarderAddress, privateKey, rpcUrl);
        logSuccess(`Forwarder address set in contract! Transaction: ${setTxHash}`);
      } catch (error) {
        logError(`Failed to set forwarder address in contract:`, error.message);
      }
    } else {
      logWarn(`Missing required environment variables for setting forwarder address:`);
      logWarn(`  CONTRACT_ADDRESS: ${contractAddress ? "✓" : "✗"}`);
      logWarn(`  PRIVATE_KEY: ${privateKey ? "✓" : "✗"}`);
      logWarn(`  RPC_URL: ${rpcUrl ? "✓" : "✗"}`);
    }
    return forwarderAddress;
  } catch (err) {
    logError("Error fetching forwarder address:", err.message);
    return null;
  }
}


// Main logic flow
async function main() {
  const {
    PRIVATE_KEY,
    RPC_URL,
    CONTRACT_ADDRESS,
    ADMIN_ADDRESS,
    LINK_TOKEN_ADDRESS,
  } = process.env;
  const UPKEEP_CONTRACT = CONTRACT_ADDRESS;
  const LINK_AMOUNT = process.env.AUTOMATION_LINK_AMOUNT;
  const GAS_LIMIT = process.env.AUTOMATION_GAS_LIMIT;
  const ADMIN = ADMIN_ADDRESS;
  const REGISTRAR = process.env.AUTOMATION_REGISTRAR_ADDRESS;
  const UPKEEP_NAME = process.env.AUTOMATION_UPKEEP_NAME || generateUpkeepName();
  const TRIGGER_TYPE = process.env.AUTOMATION_TRIGGER_TYPE;

  logInfo(`Using upkeep name: ${UPKEEP_NAME}`);
  const txHash = await transferAndRegisterUpkeep({
    LINK_TOKEN_ADDRESS,
    REGISTRAR,
    LINK_AMOUNT,
    PRIVATE_KEY,
    RPC_URL,
    UPKEEP_NAME,
    CONTRACT_ADDRESS: UPKEEP_CONTRACT,
    GAS_LIMIT,
    ADMIN,
    TRIGGER_TYPE,
  });
  if (!txHash) process.exit(1);
  await signAutomationMessage(ADMIN, REGISTRAR, txHash);
  const forwarder = await saveForwarderFromTx(txHash, "AUTOMATION_FORWARDER_ADDRESS");
  if (forwarder) {
    console.log(`\n✅ Forwarder address saved: ${forwarder}`);
    try {
      console.log(`\n==== Setting Forwarder Address in Contract ====`);
      const setTxHash = await setForwarderAddress(UPKEEP_CONTRACT, forwarder, PRIVATE_KEY, RPC_URL);
      console.log(`✅ Forwarder address set in contract! Transaction: ${setTxHash}`);
    } catch (error) {
      console.error(`❌ Failed to set forwarder address in contract:`, error.message);
    }
  } else {
    logWarn("Could not fetch forwarder address from tx hash.");
  }
}


// Parse command-line arguments for forwarder fetch mode
const args = process.argv.slice(2);
const forwarderIdx = args.indexOf("--forwarder-tx");
const specificForwarderIdx = args.indexOf("--fetch-forwarder");
const setForwarderIdx = args.indexOf("--set-forwarder");

if (forwarderIdx !== -1 && args[forwarderIdx + 1]) {
  const txHash = args[forwarderIdx + 1];
  saveForwarderFromTx(txHash).then(() => process.exit(0));
} else if (specificForwarderIdx !== -1 && args[specificForwarderIdx + 1]) {
  const txHash = args[specificForwarderIdx + 1];
  fetchForwarderFromSpecificTx(txHash).then(() => process.exit(0));
} else if (setForwarderIdx !== -1 && args[setForwarderIdx + 1]) {
  const forwarderAddress = args[setForwarderIdx + 1];
  const contractAddress = process.env.CONTRACT_ADDRESS;
  const privateKey = process.env.PRIVATE_KEY;
  const rpcUrl = process.env.RPC_URL;
  if (!contractAddress || !privateKey || !rpcUrl) {
    logError("Missing required environment variables: CONTRACT_ADDRESS, PRIVATE_KEY, RPC_URL");
    process.exit(1);
  }
  setForwarderAddress(contractAddress, forwarderAddress, privateKey, rpcUrl)
    .then((txHash) => {
      logSuccess(`Forwarder address set! Transaction: ${txHash}`);
      process.exit(0);
    })
    .catch((error) => {
      logError("Failed to set forwarder address:", error.message);
      process.exit(1);
    });
} else {
  main();
}
