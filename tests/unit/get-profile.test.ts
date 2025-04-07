import { expect } from 'chai';
import { callAPI } from "../helpers/api.ts";
import TestDatabaseHelper from "../helpers/database.ts";
import Constants from "../helpers/constants.ts";

suite("get-profile", function() {

    suiteSetup(async function() {
        await TestDatabaseHelper.wipeDatabase();
    });

    teardown(async function() {
        await TestDatabaseHelper.wipeDatabase();
    });

    suite("Sanity", function() {
        test("User profile (learner)", async function() {
            const result = await callAPI('get-profile', {}, false);
            console.log(`Profile result: ${JSON.stringify(result)}`);

            expect(result).to.be.an('object');
            expect(result).to.have.keys(['name', 'email', 'signUpDate', 'role', 'completedCourses']);

            expect(result).to.have.property('name').equal(Constants.users.LearnerName);
            expect(result).to.have.property('email').equal(Constants.users.LearnerEmail);
            expect(result).to.have.property('role').equal("Learner");
            expect(result).to.have.property('signUpDate').equal(Constants.users.LearnerSignup);
            expect(result).to.have.property('completedCourses').deep.equal([]);
        });

        test("User profile (admin)", async function() {
            const result = await callAPI('get-profile', {}, true);
            console.log(`Profile result: ${JSON.stringify(result)}`);

            expect(result).to.be.an('object');
            expect(result).to.have.keys(['name', 'email', 'signUpDate', 'role', 'completedCourses']);

            expect(result).to.have.property('name').equal(Constants.users.AdminName);
            expect(result).to.have.property('email').equal(Constants.users.AdminEmail);
            expect(result).to.have.property('role').equal("Admin");
            expect(result).to.have.property('signUpDate').equal(Constants.users.AdminSignup);
            expect(result).to.have.property('completedCourses').deep.equal([]);
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
