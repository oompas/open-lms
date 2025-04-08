import { config } from 'dotenv';
import { existsSync } from "fs";

// Configures .env.local if present (local development)
const envPath = '.env.local';
if (existsSync(envPath)) {
    console.log(`.env.local file found (local development), configuring...`);
    config({ path: envPath, override: false });
} else {
    console.log(`No .env.local file found (GitHub actions), skipping local envar config...`);
}

if (!process.env.IS_SANITY) {
    throw new Error("Please specify the IS_SANITY envar manually (actions env: or set in your run" +
        " script/configuration)");
}
