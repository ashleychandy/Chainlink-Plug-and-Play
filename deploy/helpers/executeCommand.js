const { exec } = require("child_process");

/**
 * Executes a shell command and returns the output
 * @param {string} command - The command to execute
 * @returns {Promise<string>} The command output
 */
function executeCommand(command) {
    return new Promise((resolve, reject) => {
        console.log(`Executing: ${command}`);
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error: ${error.message}`);
                reject(error);
                return;
            }
            if (stderr) {
                console.log(`stderr: ${stderr}`);
            }
            console.log(`stdout: ${stdout}`);
            resolve(stdout);
        });
    });
}

module.exports = executeCommand;