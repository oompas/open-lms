import { expect } from 'chai';
import { callAPI } from "../helpers/api.ts";
import TestDatabaseHelper from "../helpers/database.ts";

suite("get-courses", function() {

    suiteSetup(async function() {
        console.log(`Wiping the database pre-test suite...`);
        await TestDatabaseHelper.wipeDatabase();
    });

    teardown(async function() {
        console.log(`Wiping database after test...`);
        await TestDatabaseHelper.wipeDatabase();
    });


    suite("get-courses", function() {

        suiteSetup(function() {
            this.skip();
        });

        test("No courses (learner)", async function() {
            const result = await callAPI('get-courses', {}, false);
            console.log(`Courses result: ${JSON.stringify(result)}`);

            expect(result).to.be.an('array');
            expect(result).to.deep.equal([]);
        });

        test("No courses (admin)", async function() {
            const result = await callAPI('get-courses', {}, true);
            console.log(`Courses result: ${JSON.stringify(result)}`);

            expect(result).to.be.an('array');
            expect(result).to.deep.equal([]);
        });
    });
});
