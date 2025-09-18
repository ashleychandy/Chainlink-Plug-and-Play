# Chainlink Plug-and-Play 🔗

A modular toolkit for deploying smart contracts with optional Chainlink services integration. This tool automates the process of:

1. Deploying your smart contract
2. Optionally integrating Chainlink Functions
3. Optionally setting up Chainlink Automation

## Quick Start 🚀

1. **Contract Requirements**: If using Chainlink Automation, your contract must implement a `setForwarderAddress` function:
   ```solidity
   function setForwarderAddress(address forwarderAddress) external {
       // Your implementation to set the forwarder address
       // This is required for Chainlink Automation integration
   }
   ```

2. Update your contract's deploy script path:

   ```bash
   # In .env file
   SCRIPT_PATH=path/to/your/DeployContract.s.sol
   ```

3. Choose your deployment type:
   ```bash
   make deploy              # Deploy contract only
   make deploy-functions    # Deploy + Chainlink Functions
   make deploy-automation   # Deploy + Chainlink Automation
   make deploy-all         # Deploy + Both services
   ```

## Features ✨

- 🤖 Chainlink Automation support
- 🔮 Chainlink Functions integration
- 🛠️ Modular deployment system
- 🔐 Secure configuration management
- 📝 Comprehensive logging
- 🔄 Automatic retries and error handling

## Project Structure 📁

\`\`\`
.
├── deploy/
│ ├── config/ # Configuration files
│ │ ├── .env.example # Environment variables template
│ │ └── validation.js # Configuration validation
│ ├── automation/ # Automation-specific scripts
│ ├── function/ # Functions-specific scripts
│ ├── helpers/ # Utility functions
│ │ ├── executeCommand.js # Command execution
│ │ ├── extractAddress.js # Address extraction
│ │ ├── log.js # Logging utility
│ │ └── updateEnvFile.js # Environment variable management (dotenv-based)
│ ├── modules/ # Core service modules
│ │ ├── automation.js # Automation module
│ │ └── functions.js # Functions module
│ └── deploy.js # Main deployment script
\`\`\`

## Setup 🚀

1. Clone the repository:
   \`\`\`bash
   git clone https://github.com/ashleychandy/Chainlink-Plug-and-Play.git
   cd Chainlink-Plug-and-Play
   \`\`\`

2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Configure environment:
   \`\`\`bash
   cp deploy/config/.env.example .env

# Edit .env with your values

\`\`\`

## Usage 💡

### Basic Deployment

Deploy your contract without any Chainlink services:
\`\`\`bash
node deploy/deploy.js
\`\`\`

### With Chainlink Functions

Deploy and set up Chainlink Functions:
\`\`\`bash
node deploy/deploy.js --functions
\`\`\`

### With Chainlink Automation

Deploy and set up Chainlink Automation:
\`\`\`bash
node deploy/deploy.js --automation
\`\`\`

### With Both Services

Deploy with both Chainlink Functions and Automation:
\`\`\`bash
node deploy/deploy.js --functions --automation
\`\`\`

## Configuration Guide 📝

### Required Environment Variables

#### Network Configuration

- \`PRIVATE_KEY\`: Your wallet private key
- \`RPC_URL\`: RPC endpoint URL
- \`CHAIN_ID\`: Network chain ID
- \`ETHERSCAN_API_KEY\`: API key for contract verification

#### Chainlink Automation (if enabled)

- \`AUTOMATION_REGISTRAR_ADDRESS\`: Automation registrar address
- \`LINK_TOKEN_ADDRESS\`: LINK token address
- \`AUTOMATION_GAS_LIMIT\`: Maximum gas limit for upkeep
- \`AUTOMATION_LINK_AMOUNT\`: LINK payment for registration
- \`AUTOMATION_TRIGGER_TYPE\`: Automation trigger type
- \`AUTOMATION_UPKEEP_NAME\`: Display name for upkeep

#### Chainlink Functions (if enabled)

- \`FUNCTIONS_ROUTER_ADDRESS\`: Chainlink Functions Router contract address
- \`FUNCTIONS_SUBSCRIPTION_ID\`: Functions subscription ID

### Optional Configuration

#### Timezone Settings

The system can generate upkeep names with timestamps in your local timezone. Set the \`TIMEZONE\` environment variable to customize this:

\`\`\`bash
# Examples of timezone configuration
export TIMEZONE=Asia/Kolkata          # India Standard Time
export TIMEZONE=America/New_York      # Eastern Time
export TIMEZONE=Europe/London         # Greenwich Mean Time
export TIMEZONE=America/Los_Angeles   # Pacific Time
export TIMEZONE=Asia/Tokyo            # Japan Standard Time
export TIMEZONE=Australia/Sydney      # Australian Eastern Time
\`\`\`

**Upkeep Name Format**: \`Test hr:min_day/month\`
- With \`TIMEZONE=Asia/Kolkata\`: \`"Test 15:30_18/9"\` (3:30 PM on Sept 18th)
- With \`TIMEZONE=America/New_York\`: \`"Test 06:00_18/9"\` (6:00 AM on Sept 18th)
- If not set: Uses system timezone (usually UTC on servers)

#### Other Optional Variables

- \`AUTOMATION_UPKEEP_NAME\`: Custom upkeep name (auto-generated with timestamp if empty)
- \`USDC_TOKEN_ADDRESS\`: USDC token address for testing
- \`ALPACA_API_KEY\` / \`ALPACA_SECRET_KEY\`: For stock price feeds

## Error Handling 🔧

The system includes comprehensive error handling and retry mechanisms:

1. **Automatic Retries**: Failed operations automatically retry with exponential backoff
2. **Validation Checks**: Input parameters are validated before execution
3. **Status Verification**: Deployment status is verified after each operation
4. **Detailed Logging**: Comprehensive logs help diagnose issues

## Troubleshooting Guide 🛠️

### Common Issues

1. **Transaction Failures**

   - Check gas settings in .env
   - Verify network stability
   - Ensure sufficient LINK balance

2. **Automation Registration Fails**

   - Verify LINK allowance
   - Check upkeep parameters
   - Confirm contract implements required interface

3. **Functions Setup Issues**
   - Verify subscription status
   - Check DON hosting configuration
   - Validate consumer contract

## API Documentation 📚

### ChainlinkFunctions Module

\`\`\`javascript
const functions = require('./deploy/modules/functions');

// Setup Functions
await functions.setupFunctions();

// Add consumer
await functions.addFunctionsConsumer(contractAddress, {
consumerAddress,
subId,
privateKey,
rpcUrl
});

// Verify consumer status
const isValid = await functions.verifyConsumer(contractAddress, config);
\`\`\`

### ChainlinkAutomation Module

\`\`\`javascript
const automation = require('./deploy/modules/automation');

// Register for automation
const upkeepId = await automation.registerAutomation(contractAddress, {
name: "Custom Upkeep",
adminAddress: "0x..."
});

// Set forwarder address
await automation.setForwarderAddress(forwarderAddress, upkeepId);

// Verify registration
const isRegistered = await automation.verifyRegistration(contractAddress);
\`\`\`

## Contributing 🤝

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License 📄

This project is licensed under the MIT License - see the LICENSE file for details.

## Support 💬

For support, please open an issue in the GitHub repository.
