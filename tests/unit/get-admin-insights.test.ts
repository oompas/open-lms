import { expect } from 'chai';
import { callAPI } from "../helpers/api.ts";
import { sanitySkipDetailed, setupWipeDb } from "../helpers/mocha.ts";
import { validateError, ValidationParams } from "../helpers/errors.ts";
import Constants from "../helpers/constants.ts";

suite("get-admin-insights", function() {

    setupWipeDb();

    suite("Sanity", function() {
        test("Admin (no data)", async function() {
            const result = await callAPI('get-admin-insights', {}, true);
        });

        test("Non-admin", async function() {
            try {
                await callAPI('get-admin-insights', {}, false);
                expect.fail("Calling as a non-admin should throw an error");
            } catch (err: any) {
                const validationParams: ValidationParams = {
                    endpoint: "get-admin-insights",
                    type: "PERMISSION",
                    request_user_id: Constants.users.LearnerUUID,
                    payload: {},
                    message: "Only administrators may call get-admin-insights"
                };

                validateError(err, validationParams);
            }
        });
    });

    suite("Detailed", function() {

        sanitySkipDetailed();
    });
});
