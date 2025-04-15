import { execSync } from 'child_process';
import './load-env.js';

if (!process.env.IS_SANITY) {
    throw new Error("Please specify the IS_SANITY envar manually (actions env: or set in your run" +
        " script/configuration)");
}

// Setup and run test command
const command = `mocha --require ts-node/register --ui tdd --slow 1000 --timeout 10000 ./tests/`;

try {
    execSync(command, { stdio: 'inherit' });
} catch (error) {
    console.error(`Tests failed with error code: ${error.status}`);
    process.exit(1);
}
