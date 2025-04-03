import { config } from 'dotenv';
import { existsSync } from "fs";

const envPath = '.env.local';
if (existsSync(envPath)) {
    console.log(`.env.local file found (local development), configuring...`);
    config({ path: envPath, override: false });
} else {
    console.log(`No .env.local file found (GitHub actions), skipping local envar config...`);
}
