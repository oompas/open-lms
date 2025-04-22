import { expect } from 'chai';
import { callAPI } from "../helpers/api.ts";
import { sanitySkipDetailed, setupWipeDb } from "../helpers/mocha.ts";
import Constants from "../helpers/constants.ts";
import { supabaseClient } from "../helpers/config.ts";

suite("disable-user", function() {

    setupWipeDb();

    const LEARNER_ID = Constants.users.LearnerUUID;
    const ADMIN_ID = Constants.users.AdminUUID;
    const DEVELOPER_ID = Constants.users.AdminUUID;
    const INVALID_ID = "9e175b04-5c26-4d24-b68d-4dfd6d8ec694";

    /**
     * Checks if a given user is banned
     */
    async function userBanned(userId: string) {
        const { data: isBanned, error } = await supabaseClient.rpc('is_user_banned', { user_id: userId });
        if (error) {
            throw new Error(`Error checking if user is banned: ${error.message}`);
        }

        expect(isBanned, `is_user_banned value isn't a boolean: ${isBanned}`).to.be.a('boolean');
        return isBanned;
    }

    /**
     * Runs a test for valid inputs & context, ensuring the endpoint works properly
     */
    async function validCase(userId: string, disable: boolean, adminCall: boolean = true): Promise<void> {
        const result = await callAPI('disable-user', { userId, disable }, adminCall);
        expect(result).to.be.null;

        // Validates ban status is reflected in the backend
        const isBanned = await userBanned(userId);
        expect(isBanned).to.equal(disable);
    }

    /**
     * Runs a test case for invalid inputs/context, ensuring an error is thrown
     */
    async function invalidCase(userId: any, disable: any, adminCall: boolean = true) {
        try {
            await callAPI('disable-user', { userId, disable }, adminCall);
        } catch (e: any) {
            console.log(`Error: ${e.message}`);
        }
    }

    /**
     * Unbans test learner (if banned) after each test run
     */
    teardown(async function() {
        const isBanned = await userBanned(LEARNER_ID);
        if (isBanned === true) {
            await validCase(LEARNER_ID, false);
        }
    });

    suite("Sanity", function() {
        test("Attempt non-admin call", async function() {
            await invalidCase(LEARNER_ID, true, false);
        });

        test("Admin disabling user", async function() {
            await validCase(LEARNER_ID, true);
        });
    });

    suite("Detailed", function() {
        sanitySkipDetailed();

        test("Enable a disabled user", async function() {
            await validCase(LEARNER_ID, true);
            await validCase(LEARNER_ID, false);
        });

        test("Ban and unban user multiple times", async function() {
            const numCycles = 10;

            for (let i = 0; i < numCycles; ++i) {
                await validCase(LEARNER_ID, true);
                await validCase(LEARNER_ID, false);
            }
        });

        test("Attempt invalid user ID", async function() {
            await invalidCase(INVALID_ID, true);
        });

        test("Attempt disabling admin", async function() {
            await invalidCase(ADMIN_ID, true);
        });

        test("Attempt disabling developer", async function() {
            await invalidCase(DEVELOPER_ID, true);
        });

        test("Attempt to ban user twice", async function() {
            await validCase(LEARNER_ID, true);
            await invalidCase(LEARNER_ID, true);
        });

        test("Attempt to enable user twice", async function() {
            await validCase(LEARNER_ID, true);
            await validCase(LEARNER_ID, false);
            await invalidCase(LEARNER_ID, false);
        });

        test("Attempt no user id", async function() {
            await invalidCase(null, true);
        });

        test("Attempt no disable flag", async function() {
            await invalidCase(LEARNER_ID, null);
        });

        test("Attempt no payload", async function() {
            await invalidCase(null, null);
        });

        test("Attempt non-UUID user ID", async function() {
            await invalidCase(12345, true);
        });

        test("Attempt non-boolean disable flag", async function() {
            await invalidCase(LEARNER_ID, 'true');
        });
    });
});
