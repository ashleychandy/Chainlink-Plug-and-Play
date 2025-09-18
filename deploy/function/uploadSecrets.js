/**
 * Chainlink Functions Secrets Upload Script
 * Uploads encrypted secrets to the DON (Decentralized Oracle Network)
 */

const { loadEnvFile } = require("../helpers/updateEnvFile");
const { SecretsManager } = require("@chainlink/functions-toolkit");

// Load environment variables
loadEnvFile();
// Use ethers v5 that comes with the Chainlink toolkit
const ethers = require("@chainlink/functions-toolkit/node_modules/ethers");

/**
 * Upload secrets to Chainlink Functions DON
 * @returns {Promise<void>}
 */
async function uploadSecrets() {
  // Arbitrum Sepolia Testnet configuration
  const routerAddress = "0x234a5fb5Bd614a7AA2FfAB244D603abFA0Ac5C5C";
  const donId = "fun-arbitrum-sepolia-1";
  const gatewayUrls = [
    "https://01.functions-gateway.testnet.chain.link/",
    "https://02.functions-gateway.testnet.chain.link/",
  ];

  const privateKey = process.env.PRIVATE_KEY;
  const rpcUrl = process.env.RPC_URL;
  const secrets = {
    alpacaKey: process.env.ALPACA_API_KEY,
    alpacaSecret: process.env.ALPACA_SECRET_KEY,
  };

  const provider = new ethers.providers.JsonRpcProvider(rpcUrl); // Connect to blockchain
  const wallet = new ethers.Wallet(privateKey);
  const signer = wallet.connect(provider);

  const secretsManager = new SecretsManager({
    signer: signer,
    functionsRouterAddress: routerAddress,
    donId: donId,
  });

  await secretsManager.initialize();

  const encryptedSecrets = await secretsManager.encryptSecrets(secrets);
  const soltIdNumber = 0;
  const expirationTimeMinutes = 1440;

  const uploadResult = await secretsManager.uploadEncryptedSecretsToDON({
    encryptedSecretsHexstring: encryptedSecrets.encryptedSecrets,
    gatewayUrls: gatewayUrls,
    slotId: soltIdNumber,
    minutesUntilExpiration: expirationTimeMinutes,
  });

  if (!uploadResult.success) {
    throw new Error(`Failed to upload secrets ${uploadResult.errorMessage}`);
  }

  const donHostedSecretsVersion = parseInt(uploadResult.version);

  console.log(donHostedSecretsVersion);
}

uploadSecrets().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
