import { expect } from 'chai';
import { callAPI } from "../helpers/config.ts";

suite("Basic test suite - sanity", function() {

    suite("Sub-suite", () => {
        test("Sub-suite test", () => {
            expect(false).to.equal(false);
        });
    });

    suite("get-courses", function() {

    });

    suite("get-course-data", function() {

    });

    suite("get-notifications", function() {
        test("", async function() {
            const result = await callAPI('get-notifications');

            console.log(`Notifications result: ${JSON.stringify(result)}`);
            expect(result).to.be.an('array');
        });
    });

    suite("get-profile", function() {

    });
});
