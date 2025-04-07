import { expect } from 'chai';
import { callAPI } from "../helpers/api.ts";
import TestDatabaseHelper from "../helpers/database.ts";
import Constants from "../helpers/constants.ts";

suite("get-notifications", function() {

    suiteSetup(async function() {
        await TestDatabaseHelper.wipeDatabase();
    });

    teardown(async function() {
        await TestDatabaseHelper.wipeDatabase();
    });

    suite("Sanity", function() {
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

    suite("Detailed", function() {

        suiteSetup(function() {
            if (Constants.IS_SANITY) {
                this.skip();
            }
        });
    });
});
