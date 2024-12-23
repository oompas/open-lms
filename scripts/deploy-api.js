import { config } from 'dotenv';
import { execSync } from 'child_process';

if (!process.env.CI) {
    // Load environment variables from .env.local
    config({ path: '.env.local' });
}

// Validate argument is a valid environment
const args = process.argv.slice(2);
if (args.length !== 1) {
    console.error('Error: Please provide exactly one argument for the environment (dev, test, prod).');
    process.exit(1);
}

const env = args[0].toUpperCase();
const validEnvironments = ['DEV', 'TEST', 'PROD'];

if (!validEnvironments.includes(env)) {
    console.error(`Error: Invalid environment "${env}". Must be one of: ${validEnvironments.join(', ')}`);
    process.exit(1);
}

// Get the appropriate environment variable
const supabaseRef = process.env[`${env.toUpperCase()}_SUPABASE_REF`];

if (!supabaseRef) {
    console.error(`Error: ${env.toUpperCase()}_SUPABASE_REF is not defined in .env.local`);
    process.exit(1);
}

const command = `supabase functions deploy --project-ref ${supabaseRef}`;

try {
    // Execute the deploy command
    execSync(command, { stdio: 'inherit' });
} catch (error) {
    console.error('Error running the deployment command:', error.message);
    process.exit(1);
}
