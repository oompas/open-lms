import { execSync } from 'child_process';
import "./acquire-mutex.js"; // Loads envars & acquires mutex

const command = `mocha --require ts-node/register --ui tdd --slow 1000 --timeout 10000 ./tests/`;

try {
    execSync(command, { stdio: 'inherit' });
} catch (error) {
    console.error(`Tests failed with error code: ${error.status}`);
    process.exit(1);
}
