import { expect } from 'chai';
import { callAPI } from "../helpers/api.ts";
import TestDatabaseHelper from "../helpers/database.ts";

suite("Sanity Tests - Basic endpoints", function() {

    suiteSetup(async function() {
        console.log(`Wiping the database pre-test suite...`);
        await TestDatabaseHelper.wipeDatabase();
    });

    teardown(async function() {
        console.log(`Wiping database after test...`);
        await TestDatabaseHelper.wipeDatabase();
    });


    suite("get-courses", function() {

    });

    suite("get-course-data", function() {

    });

    suite("get-notifications", function() {

        test("No notifications (learner)", async function() {
            const result = await callAPI('get-notifications', {}, false);
            console.log(`Notifications result: ${JSON.stringify(result)}`);

            expect(result).to.be.an('array');
            expect(result).to.deep.equal([]);
        });

        test("No notifications (admin)", async function() {
            const result = await callAPI('get-notifications', {}, true);
            console.log(`Notifications result: ${JSON.stringify(result)}`);

            expect(result).to.be.an('array');
            expect(result).to.deep.equal([]);
        });
    });

    suite("get-profile", function() {

    });
});
