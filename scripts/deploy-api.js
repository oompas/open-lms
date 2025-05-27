import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import './load-env.js';

/**
 * Configure and validate the environment
 */

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
const command = `supabase functions deploy --project-ref ${supabaseRef} --jobs 50 --use-api`;

try {
    execSync(command, { stdio: 'inherit' });
} catch (error) {
    console.error('Error running the deployment command:', error.message);
    process.exit(1);
}


/**
 * Delete cloud functions not present locally
 */

// Get the project's functions directory
const projectRoot = process.cwd();
const functionsDir = path.join(projectRoot, 'supabase', 'functions');

// List local function names
function getLocalFunctions() {
    try {
        return fs.readdirSync(functionsDir).filter(file => {
            const fullPath = path.join(functionsDir, file);
            return fs.statSync(fullPath).isDirectory() && file !== "_shared"; // Ignore _shared folder (not a function)
        }).sort();
    } catch (error) {
        console.error(`Could not read local functions directory at ${functionsDir} - ensure it exists. Error: ${error.message}`);
        process.exit(1);
    }
}

// List remote function names
function getRemoteFunctions() {
    try {
        const command = `supabase functions list --project-ref ${supabaseRef}`;
        const output = execSync(command, { encoding: 'utf8' });
        const lines = output.trim().split('\n');

        if (lines.length < 3) {
            throw new Error('Unexpected output format from "supabase functions list". Expected at least header, separator, and function rows.');
        }

        // Parse the header lines
        const headers = lines[0].trim().split('|').map(h => h.trim());
        const expectedHeaders = ['ID', 'NAME', 'SLUG', 'STATUS', 'VERSION', 'UPDATED_AT (UTC)'];
        if (!expectedHeaders.every(h => headers.includes(h)) || expectedHeaders.length !== headers.length) {
            throw new Error(`Headers in "supabase functions list" output don't match expected: ${expectedHeaders.join(', ')}, Got: ${headers.join(', ')}`);
        }

        const nameIndex = headers.indexOf('NAME');
        if (nameIndex === -1) {
            throw new Error('Could not find "NAME" column in remote function list output.');
        }

        // Parse the separator line
        const separatorLine = lines[1].trim();
        const expectedSeparatorRegex = new RegExp(headers.map(_ => `-+`).join('\\s*\\|\\s*'));
        if (!expectedSeparatorRegex.test(separatorLine)) {
            throw new Error(`Unexpected separator format in "supabase functions list" output. Expected a line matching: ${expectedSeparatorRegex}`);
        }

        const functionNames = [];
        // Parse function data rows
        for (let i = 2; i < lines.length; ++i) {
            const line = lines[i].trim();
            if (line) {
                const columns = line.split('|').map(c => c.trim());

                if (columns.length !== headers.length) {
                    throw new Error(`Line ${i + 1} has an incorrect number of columns. Expected ${headers.length}, got ${columns.length}.`);
                }

                const functionName = columns[nameIndex];
                if (!/^[a-z]+(-[a-z]+)*$/.test(functionName)) {
                    throw new Error(`Error: Function "${functionName}" has an invalid name format. Expected lowercase letters and hyphens.`);
                }
                functionNames.push(functionName);
            }
        }

        return functionNames.sort();
    } catch (error) {
        console.error(`Error listing remote functions: ${error.message}`);
        process.exit(1);
    }
}

// Delete a remote function
function deleteRemoteFunction(functionName) {
    try {
        console.log(`Initiating deletion process for remote function: ${functionName}`);
        const command = `supabase functions delete ${functionName} --project-ref ${supabaseRef}`;
        execSync(command, { stdio: 'inherit' });
    } catch (error) {
        console.error(`Error deleting remote function "${functionName}":`, error.message);
        process.exit(1);
    }
}

// Get lists of local and remote functions
console.log('\n\n--- Starting function deletion process ---');

const localFunctions = getLocalFunctions();
console.log(`Local functions found: ${JSON.stringify(localFunctions)}`);

const remoteFunctions = getRemoteFunctions();
console.log(`Remote functions found: ${JSON.stringify(remoteFunctions)}`);

// Identify and delete functions to delete from the cloud
const functionsToDelete = remoteFunctions.filter(func => !localFunctions.includes(func));

if (functionsToDelete.length > 0) {
    console.log('\nThe following remote functions are not present locally and will be deleted:');
    functionsToDelete.forEach(funcToDelete => console.log(`- ${funcToDelete}`));
    console.log();

    functionsToDelete.forEach(funcToDelete => deleteRemoteFunction(funcToDelete));
} else {
    console.log('\nNo remote functions found that need to be deleted.');
}

console.log('--- Function deletion process finished ---');
