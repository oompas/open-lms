import { config } from 'dotenv';
import { execSync } from 'child_process';

config({ path: '.env.local' });

const folder = process.argv[2].toLowerCase();
if (folder !== 'sanity' && folder !== 'detailed') {
    console.error('Error: Folder name must be either "sanity" or "detailed" (case insensitive)');
    process.exit(1);
}

console.log('Available environment variables:');
console.log('TEST_SUPABASE_URL:', process.env.TEST_SUPABASE_URL ? 'Set' : 'Not set');
console.log('TEST_SUPABASE_ANON_KEY:', process.env.TEST_SUPABASE_ANON_KEY ? 'Set' : 'Not set');
console.log('TEST_ADMIN_EMAIL:', process.env.TEST_ADMIN_EMAIL ? 'Set' : 'Not set');
console.log('TEST_ADMIN_PASSWORD:', process.env.TEST_ADMIN_PASSWORD ? 'Set' : 'Not set');
console.log('TEST_LEARNER_EMAIL:', process.env.TEST_LEARNER_EMAIL ? 'Set' : 'Not set');
console.log('TEST_LEARNER_PASSWORD:', process.env.TEST_LEARNER_PASSWORD ? 'Set' : 'Not set');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set');

const command = `mocha --ui tdd ./tests/${folder}/`;

try {
    execSync(command, { stdio: 'inherit' });
} catch (error) {
    process.exit(1);
}

// // Create a command that explicitly passes environment variables
// const command = `TEST_SUPABASE_URL="${process.env.TEST_SUPABASE_URL}" ` +
//     `TEST_SUPABASE_ANON_KEY="${process.env.TEST_SUPABASE_ANON_KEY}" ` +
//     `TEST_ADMIN_EMAIL="${process.env.TEST_ADMIN_EMAIL}" ` +
//     `TEST_ADMIN_PASSWORD="${process.env.TEST_ADMIN_PASSWORD}" ` +
//     `TEST_LEARNER_EMAIL="${process.env.TEST_LEARNER_EMAIL}" ` +
//     `TEST_LEARNER_PASSWORD="${process.env.TEST_LEARNER_PASSWORD}" ` +
//     `NEXT_PUBLIC_SUPABASE_URL="${process.env.NEXT_PUBLIC_SUPABASE_URL}" ` +
//     `NEXT_PUBLIC_SUPABASE_ANON_KEY="${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}" ` +
//     `mocha --ui tdd ./tests/${folder}/`;