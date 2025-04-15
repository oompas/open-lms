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
    const sourceFolderPath = path.join(process.cwd(), sourceFolder);
    const sourceFiles = await fs.readdir(sourceFolderPath);
    const ignoredFakeFiles = Object.values(config.ignoreScripts).flat().filter(script => !sourceFiles.includes(script));

    if (!config.scriptsOrder || !config.ignoreScripts) {
        throw new Error(`Invalid configuration file: must have scriptsOrder and ignoreScripts`);
    }
    if (sourceFiles.length !== config.scriptsOrder.length) {
        throw new Error(`Mismatch: You have defined ${config.scriptsOrder.length} scripts in the configuration, but ${sourceFiles.length} scripts exist`);
    }
    if (ignoredFakeFiles.length !== 0) {
        throw new Error(`You have ignored scripts that don;t exist: ${ignoredFakeFiles.join(', ')}`);
    }

    // Read and prepare SQL scripts based on the JSON configuration
    const scripts = [];
    for (let i = 0; i < config.scriptsOrder.length; ++i) {
        const script = config.scriptsOrder[i];
        if (config.ignoreScripts[environment].includes(script)) {
            continue;
        }

        const filePath = path.join(sourceFolderPath, script);
        try {
            const content = await fs.readFile(filePath, 'utf8');
            const fullContent = `-- SQL from: ${script}\n\n` + content.trim() + '\n\n';
            scripts.push(fullContent);
        } catch (readError) {
            console.error(`Error reading file '${script}': ${readError.message}`);
            process.exit(1);
        }
    }

    await fs.writeFile(outputFile, scripts.join(''), 'utf8');
    console.log(`Successfully merged SQL scripts into '${outputFile}'.`);

} catch (error) {
    console.error(`An error occurred during the merge process: ${error.message}`);
    process.exit(1);
}
