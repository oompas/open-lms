import { config } from 'dotenv';
import { execSync } from 'child_process';

config({ path: '.env.local' });

const folder = process.argv[2].toUpperCase();
if (folder !== 'SANITY' && folder !== 'DETAILED') {
    console.error('Error: Folder name must be either "SANITY" or "DETAILED".');
    process.exit(1);
}

const command = `mocha --ui tdd ./tests/${folder}/`;

try {
    execSync(command, { stdio: 'inherit' });
} catch (error) {
    process.exit(1);
}
