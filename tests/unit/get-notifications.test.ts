import { expect } from 'chai';
import { callAPI } from "../helpers/api.ts";
import { sanitySkipDetailed, setupWipeDb } from "../helpers/mocha.ts";

suite("get-notifications", function() {

    setupWipeDb();

    suite("Sanity", function() {
        test("No notifications (learner)", async function() {
            const result = await callAPI('get-notifications', {}, false);

            expect(result).to.be.an('array');
            expect(result).to.deep.equal([]);
        });

        test("No notifications (admin)", async function() {
            const result = await callAPI('get-notifications', {}, true);

            expect(result).to.be.an('array');
            expect(result).to.deep.equal([]);
        });
    });

    suite("Detailed", function() {

        sanitySkipDetailed();
    });
});
