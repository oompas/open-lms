import { expect } from 'chai';
import { callAPI } from "../helpers/api.ts";
import { sanitySkipDetailed, setupWipeDb } from "../helpers/mocha.ts";

suite("get-courses", function() {

    setupWipeDb();

    suite("Sanity", function() {

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

    suite("Detailed", function() {

        sanitySkipDetailed();
    });
});
