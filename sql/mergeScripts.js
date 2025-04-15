import fs from 'node:fs/promises';
import path from 'node:path';

// Get the environment from the arguments
const args = process.argv.slice(2);
const environment = args[0].toUpperCase();

const environments = ["PROD", "DEV", "TEST"];
if (args.length !== 1) {
    console.error(`Error: Exactly one argument must be provided, the environment`);
    process.exit(1);
}
if (!environments.includes(environment)) {
    console.error(`Environment '${environment}' is not recognised`);
    process.exit(1);
}

// configure and log input and output paths
const sourceFolder = './sql/setup';
const outputFile = './sql/merged_setup.sql';
const configFile = './sql/mergeConfig.json';

console.log(`Starting SQL script merge for environment: ${environment}`);
console.log(`Merging scripts from ${sourceFolder} into output file ${outputFile} with configurations from ${configFile}\n`);

try {
    // Read the JSON configuration file
    const configPath = path.join(process.cwd(), configFile);
    const configContent = await fs.readFile(configPath, 'utf8');
    const config = JSON.parse(configContent);

    // Validate the configuration
    if (!config.scriptsOrder || !config.ignoreScripts) {
        throw new Error(`Invalid configuration file: must have a scriptsOrder array and ignoreScripts object`);
    }

    // Read and prepare SQL scripts based on the JSON configuration
    const scripts = [];
    for (let i = 0; i < config.scriptsOrder.length; ++i) {
        const script = config.scriptsOrder[i];
        if (config.ignoreScripts[environment].includes(script)) {
            continue;
        }

        const filePath = path.join(process.cwd(), sourceFolder, script);
        try {
            const content = await fs.readFile(filePath, 'utf8');
            const fullContent = `-- SQL from: ${script}\n\n` + content + '\n\n';
            scripts.push(fullContent);
        } catch (readError) {
            console.error(`Error reading file '${script}': ${readError.message}`);
            process.exit(1);
        }
    }

    await fs.writeFile(outputFile, scripts.join('\n'), 'utf8');
    console.log(`\nSuccessfully merged SQL scripts into '${outputFile}'.`);

} catch (error) {
    console.error(`An error occurred during the merge process: ${error.message}`);
    process.exit(1);
}
