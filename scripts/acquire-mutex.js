import TestMutex from "./TestMutex.js";
import { environment } from './load-env.js';

const isSanity = process.env.IS_SANITY?.toLowerCase() === 'true';
const timeout = isSanity ? 5 : 60;
const testType = isSanity ? "SANITY" : "DETAILED";

// Create mutex helper and acquire it before testing
const testMutex = new TestMutex(environment, timeout, testType);
await testMutex.acquire();

// Create hook to release mutex after tests finish
export const mochaHooks = {
    afterEach: [
        function() {
            if (this.currentTest.state === 'failed') {
                testMutex.testFailed();
            }
        }
    ],
    afterAll: [
        async function() {
            await testMutex.release();
        }
    ]
};
