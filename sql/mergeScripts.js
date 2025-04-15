import fs from 'node:fs/promises';
import path from 'node:path';

// Get the environment from the arguments
const args = process.argv.slice(2);
const environment = args[0].toUpperCase();

if (!environment) {
    console.error(`Error: must specify an environment through arguments`);
    process.exit(1);
}
if (args.length !== 1) {
    console.error(`Error: Exactly one argument must be provided, the environment`);
    process.exit(1);
}

// Configure and log input and output paths
const sourceFolder = './sql/setup';
const outputFile = './sql/merged_setup.sql';

console.log(`Starting SQL script merge for environment: ${environment}`);
console.log(`Merging scripts from ${sourceFolder} into output file ${outputFile}\n`);

try {
    // Get and validate the SQL files in the provided directory
    const setupFolderPath = path.join(process.cwd(), sourceFolder);
    const sqlFiles = await fs.readdir(setupFolderPath);

    if (sqlFiles.length === 0) {
        throw new Error(`No SQL files found in the '${sourceFolder}' folder.`);
    }

    const nonSql = sqlFiles.filter((f) => !f.endsWith('.sql'));
    if (nonSql.length !== 0) {
        throw new Error(`Non-SQL files found in directory ${sourceFolder}: ${nonSql.join(', ')}`);
    }

    console.log(`Files in folder: ${sqlFiles.join(', ')}`);

    // Parse each SQL file
    const scripts = [];
    for (const file of sqlFiles) {
        const filePath = path.join(setupFolderPath, file);
        try {
            const content = await fs.readFile(filePath, 'utf8');
            const lines = content.split('\n');

            // Get the script's order
            let order = Infinity;
            const orderMatch = lines[0].match(/^--\s*ORDER:\s*(\d+)/i);
            if (orderMatch) {
                order = parseInt(orderMatch[1], 10);
                lines.shift();
            } else {
                throw new Error(`All script must have '-- ORDER: n' as their first line`);
            }

            // Parse the script's ignored environments (if present)
            let ignoreEnvironments = [];
            const ignoreMatch = lines[0].match(/^--\s*ENV_IGNORE:\s*(.+)/i);
            if (ignoreMatch) {
                ignoreEnvironments = ignoreMatch[1].split(',').map(env => env.trim());
                lines.shift();
            }

            scripts.push({ name: file, path: filePath, content: lines.join(''), order, ignoreEnvironments });
        } catch (readError) {
            console.error(`Error reading file '${file}': ${readError.message}`);
            process.exit(1);
        }
    }

    // Sort scripts based on their order
    scripts.sort((a, b) => a.order - b.order);

    let mergedContent = '';
    for (const script of scripts) {
        if (script.ignoreEnvironments.includes(environment)) {
            console.log(`Ignoring script '${script.name}' for environment '${environment}'.`);
            continue;
        }

        mergedContent += `-- SQL from: ${script.name} (${script.order})\n\n`;
        mergedContent += script.content.trim();
        mergedContent += '\n\n';
    }

    await fs.writeFile(outputFile, mergedContent.trim() + '\n', 'utf8');
    console.log(`\nSuccessfully merged SQL scripts into '${outputFile}'.`);

} catch (error) {
    console.error(`An error occurred during the merge process: ${error.message}`);
    process.exit(1);
}
