// scripts/list-local-functions.js
import fs from 'fs';
import path from 'path';

const functionsDir = path.join(__dirname, '..', 'supabase', 'functions');

try {
    const files = fs.readdirSync(functionsDir);
    const localFunctions = files.filter(file => file.endsWith('.sql'));
    console.log(localFunctions.join('\n'));
} catch (error) {
    console.error('Error listing local functions:', error.message);
    process.exit(1);
}
