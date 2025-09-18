const executeCommand = require("../helpers/executeCommand");
const { updateEnvFile, getEnvVar } = require("../helpers/updateEnvFile");
const { logInfo, logSuccess, logWarn } = require("../helpers/log");

class ChainlinkAutomation {
    /**
     * Initialize Chainlink Automation module
     * @param {Object} config - Configuration object
     * @param {number} [config.maxRetries=3] - Maximum number of retry attempts
     * @param {number} [config.retryDelay=2000] - Delay between retries in milliseconds
     */
    constructor(config = {}) {
        this.config = {
            maxRetries: config.maxRetries || 3,
            retryDelay: config.retryDelay || 2000,
            gasLimit: getEnvVar("AUTOMATION_GAS_LIMIT", "500000"),
            linkAmount: getEnvVar("AUTOMATION_LINK_AMOUNT", "200000000000000000"), // 0.2 LINK
        };
    }

    /**
     * Registers a contract for Chainlink Automation
     * @param {string} contractAddress - The address of the contract to register
     * @param {Object} [options] - Registration options
     * @param {string} [options.name] - Custom name for the upkeep
     * @param {string} [options.adminAddress] - Admin address for the upkeep
     * @returns {Promise<void>}
     */
    async registerAutomation(contractAddress, options = {}) {
        logInfo("⚙️ Setting up Chainlink Automation (forwarder only)");

        try {
            const output = await executeCommand(`node deploy/automation/registerAutomation.js`);

            // Check if forwarder address was set successfully
            if (output.includes("Forwarder address set in contract!")) {
                logSuccess("Automation setup completed successfully");
                logInfo("Forwarder address configured in contract");
            } else {
                logWarn("Automation setup completed but forwarder status unclear");
            }

            return;
        } catch (error) {
            throw new Error(`Failed to register automation: ${error.message}`);
        }
    }

    /**
     * Sets the forwarder address for an automation upkeep
     * @param {string} forwarderAddress - The address of the forwarder contract
     * @param {string} upkeepId - The ID of the upkeep
     * @returns {Promise<void>}
     */
    async setForwarderAddress(forwarderAddress, upkeepId) {
        if (!upkeepId) {
            throw new Error("Missing upkeep ID");
        }

        logInfo(`Setting forwarder address for upkeep ${upkeepId}`);

        try {
            await executeCommand(`node deploy/automation/setForwarderAddress.js ${forwarderAddress} ${upkeepId}`);

            logSuccess("Forwarder address set successfully");
            updateEnvFile("AUTOMATION_FORWARDER_ADDRESS", forwarderAddress);
        } catch (error) {
            throw new Error(`Failed to set forwarder address: ${error.message}`);
        }
    }

}

module.exports = new ChainlinkAutomation();