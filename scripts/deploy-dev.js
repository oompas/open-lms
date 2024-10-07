import { config } from 'dotenv';
import { execSync } from 'child_process';

config({ path: '.env.local' });

const supabaseRef = process.env.DEV_SUPABASE_REF;

if (!supabaseRef) {
    console.error('Error: DEV_SUPABASE_REF is not defined in .env.local');
    process.exit(1);
}

const command = `supabase functions deploy --project-ref ${supabaseRef}`;

try {
    execSync(command, { stdio: 'inherit' });
} catch (error) {
    console.error('Error running the deployment command:', error.message);
    process.exit(1);
}
