import { expect } from 'chai';
import { callAPI } from "../helpers/api.ts";

suite("Basic endpoints", function() {

    suite("get-courses", function() {

    });

    suite("get-course-data", function() {

    });

    suite("get-notifications", function() {

        test("No notifications (learner)", async function() {
            const result = await callAPI('get-notifications', {}, false);
            console.log(`Notifications result: ${JSON.stringify(result)}`);

            expect(result).to.be.an('array');
            expect(result).to.deep.equal(expected);
        });

        test("No notifications (admin)", async function() {
            const result = await callAPI('get-notifications', {}, true);
            console.log(`Notifications result: ${JSON.stringify(result)}`);

            expect(result).to.be.an('array');
            expect(result).to.deep.equal(expected);
        });
    });

    suite("get-profile", function() {

    });
});
