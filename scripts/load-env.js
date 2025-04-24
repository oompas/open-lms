import { config } from 'dotenv';
import { existsSync } from "fs";

// Configures .env.local if present (local development)
const envPath = '.env.local';
const environment = existsSync(envPath) ? 'LOCAL' : 'GITHUB_ACTIONS';

if (environment === 'LOCAL') {
    console.log(`.env.local file found (local development), configuring...`);
    config({ path: envPath, override: false });
} else {
    console.log(`No .env.local file found (GitHub actions), skipping local envar config...`);
}

export { environment };
