import { expect } from 'chai';
import { callAPI } from "../helpers/api.ts";
import { sanitySkipDetailed, setupWipeDb } from "../helpers/mocha.ts";

suite("get-admin-insights", function() {

    setupWipeDb();

    suite("Sanity", function() {
        test("Admin (no data)", async function() {
            const result = await callAPI('get-admin-insights', {}, true);

            console.log(`result: ${JSON.stringify(result, null, 4)}`);
        });

        test("Non-admin", async function() {
            try {
                await callAPI('get-admin-insights', {}, false);
                expect.fail("Calling as a non-admin should throw an error");
            } catch (err: any) {
                console.log(`Err msg: ${err.message}`);
            }
        });
    });

    suite("Detailed", function() {

        sanitySkipDetailed();
    });
});
