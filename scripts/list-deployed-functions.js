// scripts/list-deployed-functions.js
import { execSync } from 'child_process';

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

const supabaseRef = process.env[`${env.toUpperCase()}_SUPABASE_REF`];

if (!supabaseRef) {
    console.error(`Error: ${env.toUpperCase()}_SUPABASE_REF is not defined in .env.local`);
    process.exit(1);
}

const command = `supabase functions list --project-ref ${supabaseRef}`;

try {
    const output = execSync(command).toString();
    console.log(output);
} catch (error) {
    console.error('Error listing deployed functions:', error.message);
    process.exit(1);
}