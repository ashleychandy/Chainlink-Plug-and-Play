/**
 * Environment variable management utilities
 * Uses dotenv for reading and fs for safe writing to .env files
 */

const fs = require("fs");
const path = require("path");
const { logSuccess, logError, logWarn } = require("./log");

/**
 * Update or add an environment variable to the .env file
 * @param {string} key - Environment variable name
 * @param {string} value - Environment variable value
 * @param {Object} options - Options for updating
 * @param {string} [options.envPath="./.env"] - Path to .env file
 * @param {boolean} [options.createIfMissing=true] - Create .env file if it doesn't exist
 * @returns {boolean} Success status
 */
function updateEnvFile(key, value, options = {}) {
    const {
        envPath = path.resolve("./.env"),
        createIfMissing = true
    } = options;

    try {
        let envContent = "";

        // Read existing .env file or create new one
        if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, "utf8");
        } else if (createIfMissing) {
            logWarn(`Creating new .env file at ${envPath}`);
            envContent = "# Environment Variables\n";
        } else {
            throw new Error(`Environment file not found: ${envPath}`);
        }

        // Handle both export and regular format
        const exportRegex = new RegExp(`^export\\s+${key}=.*`, "m");
        const regularRegex = new RegExp(`^${key}=.*`, "m");
        const newLine = `export ${key}=${value}`;

        if (exportRegex.test(envContent)) {
            // Replace existing export line
            envContent = envContent.replace(exportRegex, newLine);
        } else if (regularRegex.test(envContent)) {
            // Replace existing regular line
            envContent = envContent.replace(regularRegex, newLine);
        } else {
            // Add new line
            if (!envContent.endsWith("\n")) {
                envContent += "\n";
            }
            envContent += `${newLine}\n`;
        }

        // Write file atomically
        const tempPath = `${envPath}.tmp`;
        fs.writeFileSync(tempPath, envContent);
        fs.renameSync(tempPath, envPath);

        // Update process.env for immediate use
        process.env[key] = value;

        logSuccess(`Updated ${key} in .env file`);
        return true;

    } catch (error) {
        logError(`Failed to update .env file: ${error.message}`);
        return false;
    }
}

/**
 * Read environment variable with fallback
 * @param {string} key - Environment variable name
 * @param {string} [defaultValue] - Default value if not found
 * @returns {string|undefined} Environment variable value
 */
function getEnvVar(key, defaultValue) {
    return process.env[key] || defaultValue;
}

/**
 * Validate that required environment variables are set
 * @param {string[]} requiredVars - Array of required variable names
 * @throws {Error} If any required variables are missing
 */
function validateRequiredEnvVars(requiredVars) {
    const missing = requiredVars.filter(key => !process.env[key]);

    if (missing.length > 0) {
        throw new Error(
            `Missing required environment variables: ${missing.join(", ")}\n` +
            "Please check your .env file and ensure all required variables are set."
        );
    }
}

/**
 * Load environment variables from .env file
 * @param {string} [envPath="./.env"] - Path to .env file
 * @returns {boolean} Success status
 */
function loadEnvFile(envPath = "./.env") {
    try {
        require("dotenv").config({ path: envPath });
        return true;
    } catch (error) {
        logError(`Failed to load .env file: ${error.message}`);
        return false;
    }
}



/**
 * Get boolean environment variable
 * @param {string} key - Environment variable name
 * @param {boolean} [defaultValue=false] - Default value if not found
 * @returns {boolean} Boolean value
 */
function getBooleanEnvVar(key, defaultValue = false) {
    const value = getEnvVar(key);
    if (!value) return defaultValue;
    return value.toLowerCase() === 'true' || value === '1';
}

/**
 * Get the system's timezone
 * @returns {string} System timezone (e.g., "America/New_York", "Europe/London")
 */
function getSystemTimezone() {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Generate upkeep name with current timestamp in user's local timezone
 * @param {string} [prefix="Test"] - Prefix for the upkeep name
 * @param {string} [timezone] - Optional timezone (defaults to system timezone or TIMEZONE env var)
 * @returns {string} Formatted upkeep name (e.g., "Test 14:30_25/12")
 */
function generateUpkeepName(prefix = "Test", timezone = null) {
    const now = new Date();

    // Priority: parameter > env var > system timezone
    const targetTimezone = timezone || getEnvVar("TIMEZONE") || getSystemTimezone();

    const options = {
        timeZone: targetTimezone,
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        day: 'numeric',
        month: 'numeric'
    };

    // Get formatted time and date parts
    const formatter = new Intl.DateTimeFormat('en-GB', options);
    const parts = formatter.formatToParts(now);

    const hours = parts.find(part => part.type === 'hour').value;
    const minutes = parts.find(part => part.type === 'minute').value;
    const day = parts.find(part => part.type === 'day').value;
    const month = parts.find(part => part.type === 'month').value;

    return `${prefix} ${hours}:${minutes}_${day}/${month}`;
}

/**
 * Get numeric environment variable
 * @param {string} key - Environment variable name
 * @param {number} [defaultValue=0] - Default value if not found
 * @returns {number} Numeric value
 */
function getNumericEnvVar(key, defaultValue = 0) {
    const value = getEnvVar(key);
    if (!value) return defaultValue;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
}

module.exports = {
    updateEnvFile,
    getEnvVar,
    getBooleanEnvVar,
    getNumericEnvVar,
    validateRequiredEnvVars,
    loadEnvFile,
    getSystemTimezone,
    generateUpkeepName
};
