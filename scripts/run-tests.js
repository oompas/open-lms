import { config } from 'dotenv';
import { execSync } from 'child_process';

config({ path: '.env.local' });

const folder = process.argv[2];
if (folder !== 'sanity' && folder !== 'detailed') {
    console.error('Error: Folder name must be either "sanity" or "detailed".');
    process.exit(1);
}

const command = `mocha --ui tdd tests/${folder}/**/*.test.ts`;

try {
    execSync(command, { stdio: 'inherit' });
} catch (error) {
    process.exit(1);
}
