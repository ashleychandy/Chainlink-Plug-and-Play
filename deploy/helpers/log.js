
/**
 * Logging utilities with timestamps and level prefixes
 */

/**
 * Internal logging function with timestamp and level prefix
 * @param {string} level - Log level (info, warn, error, success)
 * @param {...any} args - Arguments to log
 */
function log(level, ...args) {
    const ts = new Date().toISOString();
    let prefix = "[INFO]";
    if (level === "error") prefix = "[ERROR]";
    else if (level === "warn") prefix = "[WARN]";
    else if (level === "success") prefix = "[SUCCESS]";
    console.log(`${ts} ${prefix}`, ...args);
}

/**
 * Log info message with timestamp
 * @param {...any} args - Arguments to log
 */
function logInfo(...args) { log("info", ...args); }

/**
 * Log warning message with timestamp
 * @param {...any} args - Arguments to log
 */
function logWarn(...args) { log("warn", ...args); }

/**
 * Log error message with timestamp
 * @param {...any} args - Arguments to log
 */
function logError(...args) { log("error", ...args); }

/**
 * Log success message with timestamp
 * @param {...any} args - Arguments to log
 */
function logSuccess(...args) { log("success", ...args); }

module.exports = { logInfo, logWarn, logError, logSuccess };