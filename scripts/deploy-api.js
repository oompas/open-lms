import { config } from 'dotenv';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path'


/**
 * Configure and validate the environment
 */

// Load environment variables from .env.local
 config({ path: '.env.local' });

// Validate argument is a valid environment
 const args = process.argv.slice(2);
if (args.length !== 1) {
    console.error('Error: Please provide exactly one argument for the environment (DEV, TEST, or PROD).');
    process.exit(1);
}

const env = args[0].toUpperCase();
const validEnvironments = ['DEV', 'TEST', 'PROD'];

if (!validEnvironments.includes(env)) {
    console.error(`Error: Invalid environment "${env}". Must be one of: ${validEnvironments.join(', ')}`);
    process.exit(1);
}


/**
 * Deploy functions to the specified environment
 */

// Get the appropriate environment variable
const supabaseRef = process.env[`${env.toUpperCase()}_SUPABASE_REF`];

if (!supabaseRef) {
    console.error(`Error: ${env.toUpperCase()}_SUPABASE_REF is not defined in .env.local`);
    process.exit(1);
}

// Build and execute the deploy command
const command = `supabase functions deploy --project-ref ${supabaseRef}`;

try {
    execSync(command, { stdio: 'inherit' });
} catch (error) {
    console.error('Error running the deployment command:', error.message);
    process.exit(1);
}


/**
 * Delete cloud functions not present locally
 */

// Get the project's
const projectRoot = process.cwd();
const functionsDir = path.join(projectRoot, 'supabase', 'functions');

// List local function names
function getLocalFunctions() {
    try {
        return fs.readdirSync(functionsDir).filter(file => {
            const fullPath = path.join(functionsDir, file);
            return fs.statSync(fullPath).isDirectory();
        });
    } catch (error) {
        console.error(`Could not read local functions directory at ${functionsDir} - ensure it exists. Error: ${error.message}`);
        process.exit(1);
    }
}

// List remote function names
function getRemoteFunctions(supabaseRef) {
    try {
        const command = `supabase functions list --project-ref ${supabaseRef}`;
        const output = execSync(command, { encoding: 'utf8' });
        const lines = output.trim().split('\n');

        if (lines.length <= 2) {
            console.warn('Warning: Could not parse remote function list.');
            return [];
        }

        // Find the index of the 'NAME' column
        const header = lines[0].trim().split(/\s+/);
        const nameIndex = header.indexOf('NAME') - 1;

        if (nameIndex === -1) {
            console.warn('Warning: Could not find "NAME" column in remote function list.');
            return [];
        }

        const functionNames = [];
        // Start from the second line (after the header)
        for (let i = 2; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line) {
                const columns = line.split(/\s{2,}/); // Split by two or more spaces
                if (columns[nameIndex] && columns[nameIndex].trim() !== '') {
                    const val = columns[nameIndex].substring(1).trim();
                    if (/^[a-z]+(-[a-z]+)*$/.test(val)) {
                        functionNames.push(val);
                    }
                }
            }
        }
        return functionNames;
    } catch (error) {
        console.error(`Error listing remote functions: ${error.message}`);
        process.exit(1);
    }
}

// Delete a remote function
function deleteRemoteFunction(supabaseRef, functionName) {
    try {
        const command = `supabase functions delete ${functionName} --project-ref ${supabaseRef} --force`;
        console.log(`Deleting remote function: ${functionName}`);
        execSync(command, { stdio: 'inherit' });
    } catch (error) {
        console.error(`Error deleting remote function "${functionName}":`, error.message);
        process.exit(1);
    }
}

// Get lists of local and remote functions
const localFunctions = getLocalFunctions();
const remoteFunctions = getRemoteFunctions(supabaseRef);

// Identify functions to delete from the cloud
const functionsToDelete = remoteFunctions.filter(func => !localFunctions.includes(func));

if (functionsToDelete.length > 0) {
    console.log('Functions to delete from the cloud:', functionsToDelete);
    functionsToDelete.forEach(funcToDelete => {
        deleteRemoteFunction(supabaseRef, funcToDelete);
    });
} else {
    console.log('No remote functions found that need to be deleted.');
}
