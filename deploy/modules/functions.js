const executeCommand = require("../helpers/executeCommand");
const { updateEnvFile } = require("../helpers/updateEnvFile");
const { logInfo, logSuccess, logWarn } = require("../helpers/log");

class ChainlinkFunctions {
    /**
     * Initialize Chainlink Functions module
     * @param {Object} config - Configuration object
     * @param {number} [config.maxRetries=3] - Maximum number of retry attempts
     * @param {number} [config.retryDelay=2000] - Delay between retries in milliseconds
     */
    constructor(config = {}) {
        this.config = {
            maxRetries: config.maxRetries || 3,
            retryDelay: config.retryDelay || 2000
        };
    }

    /**
     * Sets up Chainlink Functions by uploading secrets
     * @returns {Promise<string>} The secrets version number
     */
    async setupFunctions() {
        logInfo("🔐 Setting up Chainlink Functions");

        try {
            const output = await executeCommand(`node deploy/function/uploadSecrets.js`);

            const numbers = output.match(/\b\d+\b/g);
            const version = numbers && numbers.length > 0 ? numbers[numbers.length - 1] : "1";

            logInfo(`📝 Secrets version: ${version}`);

            if (!updateEnvFile("FUNCTIONS_SECRETS_VERSION", version)) {
                throw new Error("Failed to update FUNCTIONS_SECRETS_VERSION in .env file");
            }

            return version;
        } catch (error) {
            logWarn("⚠️ Secrets upload failed:", error.message);
            logInfo("Using default version: 1");

            if (!updateEnvFile("FUNCTIONS_SECRETS_VERSION", "1")) {
                throw new Error("Failed to set default FUNCTIONS_SECRETS_VERSION");
            }

            return "1";
        }
    }

    /**
     * Adds a contract as a consumer to the Chainlink Functions subscription
     * @param {string} contractAddress - The address of the contract to add as consumer
     * @param {Object} config - Configuration object
     * @param {string} config.routerAddress - The address of the Functions router contract
     * @param {string} config.subscriptionId - The subscription ID
     * @param {string} config.privateKey - The private key for transaction signing
     * @param {string} config.rpcUrl - The RPC URL for the network
     * @throws {Error} If parameters are missing or invalid
     */
    async addFunctionsConsumer(contractAddress, config) {
        const { routerAddress, subscriptionId, privateKey, rpcUrl } = config;

        // Validate parameters
        if (!contractAddress || !routerAddress || !subscriptionId || !privateKey || !rpcUrl) {
            throw new Error("Missing required parameters for adding Functions consumer");
        }

        logInfo(`🔄 Adding ${contractAddress} as Functions Consumer`);

        try {
            const command = `cast send ${routerAddress} "addConsumer(uint64,address)" ${subscriptionId} ${contractAddress} --private-key ${privateKey} --rpc-url ${rpcUrl}`;

            const deployOutput = await executeCommand(command);

            if (!deployOutput.includes('"status":"1"') && !deployOutput.includes("status               1 (success)")) {
                throw new Error("Transaction failed - check gas settings and network status");
            }

            logSuccess(`Successfully added ${contractAddress} as consumer to Functions subscription ${subscriptionId}`);
            logInfo(`🎉 Contract is now authorized to use Chainlink Functions!`);
        } catch (error) {
            throw new Error(`Failed to add Functions consumer: ${error.message}`);
        }
    }

    /**
     * Verify Functions consumer status
     * @param {string} contractAddress - The address of the contract to check
     * @param {Object} config - Configuration object
     * @param {string} config.routerAddress - The address of the Functions router contract
     * @param {string} config.subscriptionId - The subscription ID
     * @param {string} config.rpcUrl - The RPC URL for the network
     * @returns {Promise<boolean>} Whether the contract is a valid consumer
     */
    async verifyConsumer(contractAddress, config) {
        const { routerAddress, subscriptionId, rpcUrl } = config;

        try {
            const command = `cast call ${routerAddress} "isAuthorizedSender(uint64,address)" ${subscriptionId} ${contractAddress} --rpc-url ${rpcUrl}`;

            const result = await executeCommand(command);

            return result.includes("0x0000000000000000000000000000000000000000000000000000000000000001");
        } catch (error) {
            logWarn(`Failed to verify consumer status: ${error.message}`);
            return false;
        }
    }
}

module.exports = new ChainlinkFunctions();