import { config } from 'dotenv';
import { execSync } from 'child_process';
import { existsSync } from 'fs';

// Load .env.local file if it exists
const envPath = '.env.local';
if (existsSync(envPath)) {
    config({ path: envPath, override: false });
}

const folder = process.argv[2].toLowerCase();
if (folder !== 'sanity' && folder !== 'detailed') {
    console.error('Error: Folder name must be either "sanity" or "detailed" (case insensitive)');
    process.exit(1);
}

const command = `mocha --ui tdd --timeout 100000 ./tests/${folder}/`;

try {
    execSync(command, { stdio: 'inherit' });
} catch (error) {
    process.exit(1);
}
