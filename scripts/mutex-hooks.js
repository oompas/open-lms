import TestMutex from "./TestMutex.js";
import { existsSync } from "fs";
import './load-env.js';

const testMutex = new TestMutex(existsSync('.env.local') ? 'local' : 'github-actions', process.env.IS_SANITY ? 5 : 60);
await testMutex.acquire();

export const mochaHooks = {
    afterAll: [
        async function() {
            await testMutex.release();
        }
    ]
};
