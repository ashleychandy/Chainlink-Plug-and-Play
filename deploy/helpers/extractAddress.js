/**
 * Extracts contract address from Forge deployment output
 * @param {string} output - The Forge command output
 * @returns {string|null} The extracted contract address or null if not found
 */
function extractAddressFromForgeOutput(output) {
    const addressPatterns = [
        /Contract Address: ([0-9a-fA-Fx]+)/,
        /Deployed to: ([0-9a-fA-Fx]+)/,
        /deployed at: ([0-9a-fA-Fx]+)/i,
        /DStock deployed at: ([0-9a-fA-Fx]+)/i,
        /Test_USDC deployed at: ([0-9a-fA-Fx]+)/i,
        /== Logs ==\s*\n\s*(0x[a-fA-F0-9]{40})/,
        /Start verifying contract `(0x[a-fA-F0-9]{40})`/,
    ];

    for (const pattern of addressPatterns) {
        const match = output.match(pattern);
        if (match && match[1]) {
            console.log(`Found address using pattern: ${pattern}`);
            return match[1];
        }
    }

    console.log("No address found in output.");
    return null;
}

module.exports = extractAddressFromForgeOutput;