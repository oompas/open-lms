import TestMutex from "./TestMutex.js";
import { environment } from './load-env.js';

// Create mutex helper and acquire it before testing
const testMutex = new TestMutex(environment, process.env.IS_SANITY ? 5 : 60);
await testMutex.acquire();

// Create hook to release mutex after tests finish
export const mochaHooks = {
    afterAll: [
        async function() {
            await testMutex.release();
        }
    ]
};
