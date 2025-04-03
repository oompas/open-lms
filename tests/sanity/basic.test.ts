import { expect } from 'chai';
import { callAPI } from "../helpers/api.ts";
import TestDatabaseHelper from "../helpers/database.ts";
import Constants from "../helpers/constants.ts";

suite("Sanity Tests - Basic endpoints", function() {

    suiteSetup(async function() {
        console.log(`Wiping the database pre-test suite...`);
        await TestDatabaseHelper.wipeDatabase();
    });

    teardown(async function() {
        console.log(`Wiping database after test...`);
        await TestDatabaseHelper.wipeDatabase();
    });


    suite("get-courses", function() {
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

    suite("get-course-data", function() {

    });

    suite("get-notifications", function() {
        test("No notifications (learner)", async function() {
            const result = await callAPI('get-notifications', {}, false);
            console.log(`Notifications result: ${JSON.stringify(result)}`);

            expect(result).to.be.an('array');
            expect(result).to.deep.equal([]);
        });

        test("No notifications (admin)", async function() {
            const result = await callAPI('get-notifications', {}, true);
            console.log(`Notifications result: ${JSON.stringify(result)}`);

            expect(result).to.be.an('array');
            expect(result).to.deep.equal([]);
        });
    });

    suite("get-profile", function() {
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
});
