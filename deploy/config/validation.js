/**
 * Configuration validation and management
 */

const { getEnvVar, getNumericEnvVar, generateUpkeepName } = require("../helpers/updateEnvFile");

const requiredEnvVars = {
    common: [
        'SCRIPT_PATH',
        'PRIVATE_KEY',
        'RPC_URL',
        'CHAIN_ID',
        'ETHERSCAN_API_KEY',
        'ADMIN_ADDRESS'
    ],
    automation: [
        'AUTOMATION_REGISTRAR_ADDRESS',
        'LINK_TOKEN_ADDRESS',
        'AUTOMATION_GAS_LIMIT',
        'AUTOMATION_LINK_AMOUNT',
        'AUTOMATION_TRIGGER_TYPE',
    ],
    functions: [
        'FUNCTIONS_ROUTER_ADDRESS',
        'FUNCTIONS_SUBSCRIPTION_ID'
    ],
    optional: [
        'ALPACA_API_KEY',
        'ALPACA_SECRET_KEY',
        'USDC_TOKEN_ADDRESS'
    ]
};

/**
 * Validates environment variables based on selected features
 * @param {Object} options - Feature flags
 * @param {boolean} options.automation - Whether Automation is enabled
 * @param {boolean} options.functions - Whether Functions is enabled
 * @throws {Error} If required environment variables are missing
 */
function validateConfig(options = { automation: false, functions: false }) {
    const missingVars = [];

    // Check common required vars
    for (const variable of requiredEnvVars.common) {
        if (!process.env[variable]) {
            missingVars.push(variable);
        }
    }

    // Check automation vars if enabled
    if (options.automation) {
        for (const variable of requiredEnvVars.automation) {
            if (!process.env[variable]) {
                missingVars.push(variable);
            }
        }
    }

    // Check functions vars if enabled
    if (options.functions) {
        for (const variable of requiredEnvVars.functions) {
            if (!process.env[variable]) {
                missingVars.push(variable);
            }
        }
    }

    if (missingVars.length > 0) {
        throw new Error(
            `Missing required environment variables:\n${missingVars.join('\n')}\n` +
            `Please check your .env file and ensure all required variables are set.`
        );
    }

    return true;
}

/**
 * Gets environment configuration for a specific service
 * @param {string} service - Service name ('automation' or 'functions')
 * @returns {Object} Configuration object for the service
 */
function getServiceConfig(service) {
    switch (service) {
        case 'automation':
            return {
                registrarAddress: getEnvVar("AUTOMATION_REGISTRAR_ADDRESS"),
                linkAddress: getEnvVar("LINK_TOKEN_ADDRESS"),
                gasLimit: getNumericEnvVar("AUTOMATION_GAS_LIMIT", 500000),
                linkAmount: getEnvVar("AUTOMATION_LINK_AMOUNT"),
                triggerType: getNumericEnvVar("AUTOMATION_TRIGGER_TYPE", 0),
                upkeepName: getEnvVar("AUTOMATION_UPKEEP_NAME") || generateUpkeepName()
            };
        case 'functions':
            return {
                routerAddress: getEnvVar("FUNCTIONS_ROUTER_ADDRESS"),
                subscriptionId: getEnvVar("FUNCTIONS_SUBSCRIPTION_ID"),
                secretsVersion: getEnvVar("FUNCTIONS_SECRETS_VERSION", "1")
            };
        default:
            throw new Error(`Unknown service: ${service}`);
    }
}

/**
 * Gets network configuration
 * @returns {Object} Network configuration
 */
function getNetworkConfig() {
    return {
        privateKey: getEnvVar("PRIVATE_KEY"),
        rpcUrl: getEnvVar("RPC_URL"),
        chainId: getNumericEnvVar("CHAIN_ID", 1),
        etherscanApiKey: getEnvVar("ETHERSCAN_API_KEY")
    };
}

module.exports = {
    validateConfig,
    getServiceConfig,
    getNetworkConfig,
    requiredEnvVars
};