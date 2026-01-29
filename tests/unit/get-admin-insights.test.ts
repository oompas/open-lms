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

            // Structure validate
            expect(result).to.be.an('object');
            expect(result).to.have.all.keys(['quizAttemptsToMark', 'courseInsights', 'learners', 'admins']);

            // Empty arrays
            expect(result.quizAttemptsToMark).to.be.an('array').that.is.empty;
            expect(result.courseInsights).to.be.an('array').that.is.empty;

            // Learners
            expect(result.learners).to.be.an('array').with.length(1);
            const learner = result.learners[0];
            expect(learner).to.have.all.keys(['id', 'email', 'name', 'role', 'coursesEnrolled', 'coursesAttempted', 'coursesCompleted']);
            expect(learner.id).to.equal(Constants.users.LearnerUUID);
            expect(learner.email).to.equal(Constants.users.LearnerEmail);
            expect(learner.name).to.equal(Constants.users.LearnerName);
            expect(learner.role).to.equal("Learner");
            expect(learner.coursesEnrolled).to.equal(0);
            expect(learner.coursesAttempted).to.equal(0)
            expect(learner.coursesCompleted).to.equal(0)

            // Admins
            expect(result.admins).to.be.an('array').with.length(1);
            const admin = result.admins[0];
            expect(admin).to.have.all.keys(['id', 'email', 'name', 'role', 'coursesCreated', 'coursesActive']);
            expect(admin.id).to.equal(Constants.users.AdminUUID);
            expect(admin.email).to.equal(Constants.users.AdminEmail);
            expect(admin.name).to.equal(Constants.users.AdminName);
            expect(admin.role).to.equal("Administrator");
            expect(admin.coursesCreated).to.equal(0);
            expect(admin.coursesActive).to.equal(0);
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
