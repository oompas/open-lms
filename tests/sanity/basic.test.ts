import { expect } from 'chai';
import { callAPI } from "../helpers/api.ts";

suite("Basic endpoints", function() {

    suite("get-courses", function() {

    });

    suite("get-course-data", function() {

    });

    suite("get-notifications", function() {

        const _test = (name: string, expected: []) =>
            test(name, async function() {
                const result = await callAPI('get-notifications', {}, false);
                console.log(`[${name}] Notifications result: ${JSON.stringify(result)}`);

                expect(result).to.be.an('array');
                expect(result).to.deep.equal(expected);
            });

        suite("Learner", async function() {
            _test("No notifications", []);
        });

        suite("Admin", async function() {
            _test("No notifications", []);
        });
    });

    suite("get-profile", function() {

    });
});
