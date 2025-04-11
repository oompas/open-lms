// scripts/sync-functions.js
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

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

const functionsDir = path.join(__dirname, '..', 'supabase', 'functions');

try {
    const deployedFunctionsOutput = execSync(`node scripts/list-deployed-functions.js ${env}`).toString();
    const deployedFunctions = deployedFunctionsOutput.split('\n').filter(Boolean);

    const localFiles = fs.readdirSync(functionsDir);
    const localFunctions = localFiles.filter(file => file.endsWith('.sql')).map(file => path.basename(file, '.sql'));

    const functionsToDelete = deployedFunctions.filter(func => !localFunctions.includes(func));

    functionsToDelete.forEach(func => {
        const deleteCommand = `supabase functions delete ${func} --project-ref ${supabaseRef}`;
        console.log(`Deleting function: ${func}`);
        execSync(deleteCommand, { stdio: 'inherit' });
    });

} catch (error) {
    console.error('Error syncing functions:', error.message);
    process.exit(1);
}
