import { execSync } from 'child_process';
import './load-env.js';

// Setup and run test command
const command = `mocha --ui tdd --slow 1000 --timeout 10000 ./tests/`;

try {
    execSync(command, { stdio: 'inherit' });
} catch (error) {
    console.error(`Tests failed with error code: ${error.status}`);
    process.exit(1);
}
