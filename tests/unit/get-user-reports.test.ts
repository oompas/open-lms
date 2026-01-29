import { expect } from 'chai';
import { callAPI } from "../helpers/api.ts";
import { sanitySkipDetailed, setupWipeDb } from "../helpers/mocha.ts";
import TestCourseGenerator from "../helpers/generators/CourseGenerator.ts";

suite("get-user-reports", function() {

    setupWipeDb();

    /**
     * Helper function to parse CSV string into array of objects
     */
    function parseCSV(csvString: string): any[] {
        const lines = csvString.trim().split('\n');
        if (lines.length < 2) return [];

        const headers = lines[0].split(',');
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            const row: any = {};
            headers.forEach((header, index) => {
                row[header] = values[index];
            });
            data.push(row);
        }

        return data;
    }

    /**
     * Helper function to validate the structure of a user report row
     */
    function validateUserReportStructure(userRow: any) {
        expect(userRow).to.be.an('object');
        expect(userRow).to.have.all.keys([
            'User ID',
            'Name',
            'Email',
            'Role',
            'Account Disabled?',
            'Email Verified?',
            'Account creation time',
            'Number of courses enrolled',
            'Number of courses started',
            'Number of courses completed'
        ]);

        expect(userRow['User ID']).to.be.a('string');
        expect(userRow['Name']).to.be.a('string');
        expect(userRow['Email']).to.be.a('string');
        expect(userRow['Role']).to.be.a('string');
        expect(userRow['Account Disabled?']).to.satisfy((val: string) => val === 'Yes' || val === 'No');
        expect(userRow['Email Verified?']).to.satisfy((val: string) => val === 'Yes' || val === 'No');
        expect(userRow['Account creation time']).to.be.a('string');
        expect(userRow['Number of courses enrolled']).to.match(/^\d+$/);
        expect(userRow['Number of courses started']).to.match(/^\d+$/);
        expect(userRow['Number of courses completed']).to.match(/^\d+$/);
    }

    /**
     * Helper function to setup test data with enrollments and course attempts
     */
    async function setupTestUserData() {
        // Create some courses for testing
        const courseIds = await TestCourseGenerator.generateDummyCourses(3);

        // Enroll in courses
        await callAPI('course-enrollment', { courseId: courseIds[0] }, false);
        await callAPI('course-enrollment', { courseId: courseIds[1] }, false);

        // Start courses (creates course attempts)
        await callAPI('start-course', { courseId: courseIds[0] }, false);
        await callAPI('start-course', { courseId: courseIds[1] }, false);

        return courseIds;
    }

    suite("Sanity", function() {

        test("Basic report generation without admin data", async function() {
            const result = await callAPI('get-user-reports', { withAdmins: false }, true);

            expect(result).to.be.a('string');
            expect(result).to.include('User ID,Name,Email,Role');

            const parsedData = parseCSV(result);
            expect(parsedData).to.be.an('array');
            expect(parsedData.length).to.be.at.least(1); // Should have at least the test learner

            // Validate structure of first row
            if (parsedData.length > 0) {
                validateUserReportStructure(parsedData[0]);
            }
        });

        test("Basic report generation with admin data", async function() {
            const result = await callAPI('get-user-reports', { withAdmins: true }, true);

            expect(result).to.be.a('string');
            expect(result).to.include('User ID,Name,Email,Role');

            const parsedData = parseCSV(result);
            expect(parsedData).to.be.an('array');
            expect(parsedData.length).to.be.at.least(2); // Should have both admin and learner

            // Validate structure of first row
            if (parsedData.length > 0) {
                validateUserReportStructure(parsedData[0]);
            }
        });

        test("Report includes correct CSV headers", async function() {
            const result = await callAPI('get-user-reports', { withAdmins: false }, true);

            const expectedHeaders = [
                'User ID',
                'Name',
                'Email',
                'Role',
                'Account Disabled?',
                'Email Verified?',
                'Account creation time',
                'Number of courses enrolled',
                'Number of courses started',
                'Number of courses completed'
            ];

            const headerLine = result.split('\n')[0];
            expect(headerLine).to.equal(expectedHeaders.join(','));
        });
    });

    suite("Detailed", function() {

        sanitySkipDetailed();

        test("Report excludes admin users when withAdmins is false", async function() {
            const result = await callAPI('get-user-reports', { withAdmins: false }, true);
            const parsedData = parseCSV(result);

            // All users should be Learners
            parsedData.forEach(user => {
                expect(user.Role).to.equal('Learner');
            });
        });

        test("Report includes admin users when withAdmins is true", async function() {
            const result = await callAPI('get-user-reports', { withAdmins: true }, true);
            const parsedData = parseCSV(result);

            // Should have both Admin and Learner roles
            const roles = parsedData.map(user => user.Role);
            expect(roles).to.include('Administrator');
            expect(roles).to.include('Learner');
        });

        test("Report correctly counts enrollments and attempts", async function() {
            await setupTestUserData();

            const result = await callAPI('get-user-reports', { withAdmins: false }, true);
            const parsedData = parseCSV(result);

            // Find the learner user (should be the only one)
            const learnerUser = parsedData.find(user => user.Role === 'Learner');
            expect(learnerUser).to.exist;

            // Should have 2 enrollments and 2 course attempts
            expect(parseInt(learnerUser['Number of courses enrolled'])).to.equal(2);
            expect(parseInt(learnerUser['Number of courses started'])).to.equal(2);
            expect(parseInt(learnerUser['Number of courses completed'])).to.equal(0); // Not completed yet
        });

        test("Report correctly handles users with no activity", async function() {
            const result = await callAPI('get-user-reports', { withAdmins: false }, true);
            const parsedData = parseCSV(result);

            // Find users with no activity
            const inactiveUsers = parsedData.filter(user =>
                parseInt(user['Number of courses enrolled']) === 0 &&
                parseInt(user['Number of courses started']) === 0 &&
                parseInt(user['Number of courses completed']) === 0
            );

            // Validate structure for inactive users
            inactiveUsers.forEach(validateUserReportStructure);
        });

        test("Report sorts users by number of enrollments (descending)", async function() {
            await setupTestUserData();

            const result = await callAPI('get-user-reports', { withAdmins: false }, true);
            const parsedData = parseCSV(result);

            // Check that users are sorted by enrollment count in descending order
            for (let i = 0; i < parsedData.length - 1; i++) {
                const currentEnrollments = parseInt(parsedData[i]['Number of courses enrolled']);
                const nextEnrollments = parseInt(parsedData[i + 1]['Number of courses enrolled']);
                expect(currentEnrollments).to.be.at.least(nextEnrollments);
            }
        });

        test("Report handles account disabled status correctly", async function() {
            const result = await callAPI('get-user-reports', { withAdmins: true }, true);
            const parsedData = parseCSV(result);

            // All test accounts should be enabled by default
            parsedData.forEach(user => {
                expect(user['Account Disabled?']).to.equal('No');
            });
        });

        test("Report handles email verification status correctly", async function() {
            const result = await callAPI('get-user-reports', { withAdmins: true }, true);
            const parsedData = parseCSV(result);

            // Check that email verification status is properly formatted
            parsedData.forEach(user => {
                expect(user['Email Verified?']).to.satisfy((val: string) => val === 'Yes' || val === 'No');
            });
        });

        test("Report includes valid timestamps", async function() {
            const result = await callAPI('get-user-reports', { withAdmins: false }, true);
            const parsedData = parseCSV(result);

            parsedData.forEach(user => {
                const timestamp = user['Account creation time'];
                expect(timestamp).to.be.a('string');
                expect(timestamp.length).to.be.greaterThan(0);
                // Should not contain commas (as they are removed in the function)
                expect(timestamp).to.not.include(',');
            });
        });

        test("Report with multiple enrollments and completions", async function() {
            const courseIds = await TestCourseGenerator.generateDummyCourses(5);

            // Enroll in all courses
            for (const courseId of courseIds) {
                await callAPI('course-enrollment', { courseId }, false);
            }

            // Start some courses
            for (let i = 0; i < 3; i++) {
                await callAPI('start-course', { courseId: courseIds[i] }, false);
            }

            const result = await callAPI('get-user-reports', { withAdmins: false }, true);
            const parsedData = parseCSV(result);

            const learnerUser = parsedData.find(user => user.Role === 'Learner');
            expect(learnerUser).to.exist;

            expect(parseInt(learnerUser['Number of courses enrolled'])).to.equal(5);
            expect(parseInt(learnerUser['Number of courses started'])).to.equal(3);
        });

        test("Report handles empty database gracefully", async function() {
            // This test runs after setupWipeDb, so database should be clean except for test users
            const result = await callAPI('get-user-reports', { withAdmins: false }, true);
            const parsedData = parseCSV(result);

            // Should still have test users with zero activity
            expect(parsedData.length).to.be.at.least(1);
            parsedData.forEach(user => {
                validateUserReportStructure(user);
                expect(parseInt(user['Number of courses enrolled'])).to.equal(0);
                expect(parseInt(user['Number of courses started'])).to.equal(0);
                expect(parseInt(user['Number of courses completed'])).to.equal(0);
            });
        });

        test("Function is idempotent", async function() {
            await setupTestUserData();

            const numCalls = 5;
            const results = [];

            for (let i = 0; i < numCalls; i++) {
                const result = await callAPI('get-user-reports', { withAdmins: false }, true);
                results.push(result);
            }

            // All results should be identical
            for (let i = 1; i < results.length; i++) {
                expect(results[i]).to.equal(results[0]);
            }
        });

        test("CSV format is valid and parseable", async function() {
            const result = await callAPI('get-user-reports', { withAdmins: true }, true);

            // Should be valid CSV format
            expect(result).to.be.a('string');
            expect(result.split('\n').length).to.be.at.least(2); // Header + at least one data row

            // Should parse without errors
            const parsedData = parseCSV(result);
            expect(parsedData).to.be.an('array');
            expect(parsedData.length).to.be.at.least(1);

            // Each row should have the same number of fields as headers
            const headerCount = result.split('\n')[0].split(',').length;
            parsedData.forEach(row => {
                expect(Object.keys(row).length).to.equal(headerCount);
            });
        });
    });
});
