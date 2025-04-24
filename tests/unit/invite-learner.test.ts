import { expect } from 'chai';
import { callAPI } from "../helpers/api.ts";
import { sanitySkipDetailed, setupWipeDb } from "../helpers/mocha.ts";

suite("invite-learner", function() {

    setupWipeDb();

    teardown(async function() {
        await new Promise(resolve => setTimeout(resolve, 500));
    });

    const TEST_EMAIL = "delivered@resend.dev";

    /**
     * Runs a test for valid inputs & context, ensuring the endpoint works properly
     */
    async function validCase(email: string = TEST_EMAIL, adminCall: boolean = true): Promise<void> {
        const result = await callAPI('invite-learner', { email }, adminCall);
        expect(result).to.be.null;
    }

    /**
     * Runs a test case for invalid inputs/context, ensuring an error is thrown
     */
    async function invalidCase(email: any, adminCall: boolean = true) {
        try {
            await callAPI('invite-learner', { email }, adminCall);
        } catch (e: any) {
            console.log(`Error: ${e.message}`);
        }
    }

    suite("Sanity", function() {
        test("Attempt non-admin call", async function() {
            await invalidCase(TEST_EMAIL, false);
        });

        test("should allow admin to send invite", async function() {
            await validCase();
        });
    });

    suite("Detailed", function() {
        sanitySkipDetailed();

        test("Invite user multiple times", async function() {
            for (let i = 0; i < 10; ++i) {
                await validCase();
            }
        });

        test("Attempt undefined email", async function() {
            await invalidCase(undefined);
        });

        test("Attempt null email", async function() {
            await invalidCase(null);
        });

        test("Attempt non-string email", async function() {
            await invalidCase(12345);
        });
    });
});
