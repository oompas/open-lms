import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { execSync } from 'child_process';
import "./load-env.js";

// Require mutex file for mocha hooks
const mutexFilePath = resolve(dirname(fileURLToPath(import.meta.url)), './acquire-mutex.js');

const command = `mocha --require ts-node/register --require ${mutexFilePath} --ui tdd --slow 1000 --timeout 10000 ./tests/`;

try {
    execSync(command, { stdio: 'inherit' });
} catch (error) {
    console.error(`Tests failed with error code: ${error.status}`);
    process.exit(1);
}
