import { config } from 'dotenv';
import { execSync } from 'child_process';
import { existsSync } from 'fs';

// Load .env.local file if it exists
const envPath = '.env.local';
if (existsSync(envPath)) {
    config({ path: envPath, override: false });
}

// Verify a valid test folder is specified
const folder = process.argv[2].toLowerCase();
if (folder !== 'sanity' && folder !== 'detailed') {
    console.error('Error: Folder name must be either "sanity" or "detailed" (case insensitive)');
    process.exit(1);
}

// Setup and run test command
const command = `mocha --ui tdd --slow 1000 --timeout 10000 ./tests/${folder}/`;

try {
    execSync(command, { stdio: 'inherit' });
} catch (error) {
    console.error(`Tests failed with error code: ${error.status}`);
    process.exit(1);
}
