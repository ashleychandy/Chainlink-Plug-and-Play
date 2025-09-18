const executeCommand = require("./helpers/executeCommand");
const { updateEnvFile, loadEnvFile, getEnvVar } = require("./helpers/updateEnvFile");
const extractAddressFromForgeOutput = require("./helpers/extractAddress");
const functions = require("./modules/functions");
const automation = require("./modules/automation");
const { validateConfig } = require("./config/validation");

// Load environment variables
loadEnvFile();

// Configuration constants
const CONFIG = {
    envVarName: "CONTRACT_ADDRESS"
};

// Extract environment variables using the helper
const PRIVATE_KEY = getEnvVar("PRIVATE_KEY");
const RPC_URL = getEnvVar("RPC_URL");
const ETHERSCAN_API_KEY = getEnvVar("ETHERSCAN_API_KEY");
const FUNCTIONS_ROUTER_ADDRESS = getEnvVar("FUNCTIONS_ROUTER_ADDRESS");
const FUNCTIONS_SUBSCRIPTION_ID = getEnvVar("FUNCTIONS_SUBSCRIPTION_ID");

/**
 * Deploy a smart contract using Forge
 * @param {string} scriptPath - Path to the Forge deployment script
 * @param {string} envVarName - Environment variable name to store the deployed address
 * @returns {Promise<string>} The deployed contract address
 */
async function deployContract(scriptPath, envVarName) {
    console.log(`\n📄 Deploying Contract`);

    if (!PRIVATE_KEY || !RPC_URL || !ETHERSCAN_API_KEY) {
        throw new Error("Missing required environment variables for deployment");
    }

    try {
        const deployOutput = await executeCommand(
            `forge script ${scriptPath} --private-key ${PRIVATE_KEY} --rpc-url ${RPC_URL} --etherscan-api-key ${ETHERSCAN_API_KEY} --broadcast --verify -vvv`
        );

        const contractAddress = extractAddressFromForgeOutput(deployOutput);
        if (!contractAddress) {
            throw new Error("Failed to extract contract address from deployment output");
        }

        console.log(`✅ Contract deployed at: ${contractAddress}`);

        if (!updateEnvFile(envVarName, contractAddress)) {
            throw new Error(`Failed to update ${envVarName} in .env file`);
        }

        return contractAddress;
    } catch (error) {
        throw new Error(`Contract deployment failed: ${error.message}`);
    }
}



/**
 * Deploy the contract with selected Chainlink services
 * @param {Object} options - Deployment options
 * @param {boolean} options.functions - Whether to enable Chainlink Functions
 * @param {boolean} options.automation - Whether to enable Chainlink Automation
 */
async function deploy(options = { functions: false, automation: false }) {
    try {
        console.log("\n🚀 Starting deployment process");
        console.log("Options:", {
            functions: options.functions ? "enabled" : "disabled",
            automation: options.automation ? "enabled" : "disabled"
        });

        // Validate configuration before starting deployment
        console.log("\n🔍 Validating configuration...");
        validateConfig(options);
        console.log("✅ Configuration validation passed");

        // Step 1: Deploy the contract
        const scriptPath = getEnvVar("SCRIPT_PATH");
        if (!scriptPath) {
            throw new Error("SCRIPT_PATH not set in .env file. Please specify your contract's deploy script path.");
        }

        const deployedAddress = await deployContract(
            scriptPath,
            CONFIG.envVarName
        );

        console.log("\n==== Deployment Complete ====");

        if (!deployedAddress) {
            throw new Error("❌ Deployment failed: No contract address returned");
        }

        // Step 2: Set up Chainlink Functions if enabled
        if (options.functions) {
            await functions.setupFunctions();
            await functions.addFunctionsConsumer(deployedAddress, {
                routerAddress: FUNCTIONS_ROUTER_ADDRESS,
                subscriptionId: FUNCTIONS_SUBSCRIPTION_ID,
                privateKey: PRIVATE_KEY,
                rpcUrl: RPC_URL
            });
        }

        // Step 3: Set up Chainlink Automation if enabled
        if (options.automation) {
            await automation.registerAutomation(deployedAddress);
        }



        // Print deployment summary
        console.log("\n🚀 Full deployment pipeline completed successfully!");
        console.log(`📋 Summary:`);
        console.log(`   • Contract deployed: ${deployedAddress}`);
        console.log(`   • Contract verified on Arbiscan`);
        if (options.functions) {
            console.log(`   • Chainlink Functions enabled`);
            console.log(`   • Added to Functions subscription: ${FUNCTIONS_SUBSCRIPTION_ID}`);
        }
        if (options.automation) {
            console.log(`   • Chainlink Automation forwarder configured`);
        }

        console.log(`   • Environment file updated`);

        process.exit(0);
    } catch (error) {
        console.error("\n❌ Deployment failed:", error.message);
        process.exit(1);
    }
}

// Check command line arguments for services to enable
const args = process.argv.slice(2);
const options = {
    functions: args.includes("--functions") || args.includes("-f"),
    automation: args.includes("--automation") || args.includes("-a")
};

// Execute deployment with selected options
deploy(options);