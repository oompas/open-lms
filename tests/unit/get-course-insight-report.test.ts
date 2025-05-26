import { expect } from 'chai';
import { callAPI } from "../helpers/api.ts";
import { sanitySkipDetailed, setupWipeDb } from "../helpers/mocha.ts";
import TestCourseGenerator from "../helpers/generators/CourseGenerator.ts";
import { ErrorType, validateError, ValidationParams } from "../helpers/errors.ts";
import Constants from "../helpers/constants.ts";
import { CourseStatus } from "../helpers/Enum/CourseStatus.ts";

suite("getCourseInsightReport", function() {

    setupWipeDb();

    /**
     * Runs a test for valid inputs & context, ensuring the endpoint works properly
     */
    async function validCase(courseId: number): Promise<void> {
        const result = await callAPI('get-course-insight-report', { courseId }, true);

        // Validate object structure
        expect(result).to.be.an('object');
        expect(result).to.have.all.keys('courseName', 'isActive', 'numEnrolled', 'numStarted', 'numComplete', 'avgTime', 'learners', 'questions');

        // Basic course data validation
        expect(result.courseName).to.be.a('string');
        expect(result.isActive).to.be.a('boolean');
        expect(result.numEnrolled).to.be.a('number').and.to.be.at.least(0).and.to.satisfy(Number.isInteger);
        expect(result.numStarted).to.be.a('number').and.to.be.at.least(0).and.to.satisfy(Number.isInteger);
        expect(result.numComplete).to.be.a('number').and.to.be.at.least(0).and.to.satisfy(Number.isInteger);
        if (result.avgTime !== null) {
            expect(result.avgTime).to.be.a('number').and.to.be.at.least(0).and.to.satisfy(Number.isInteger);
        }

        // Learner data validation
        expect(result.learners).to.be.an('array');

        result.learners.forEach((learner: any) => {
            expect(learner).to.be.an('object');
            expect(learner).to.have.all.keys('name', 'userId', 'status', 'latestQuizAttemptId', 'latestQuizAttemptTime');

            expect(learner.name).to.be.a('string');
            expect(learner.userId).to.be.a('string').and.to.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/);
            expect(learner.status).to.be.a('string').and.to.be.oneOf(Object.values(CourseStatus));

            // If one quiz field is null, both must logically be null
            if (learner.latestQuizAttemptId === null || learner.latestQuizAttemptTime === null) {
                expect(learner.latestQuizAttemptTime).to.be.null;
                expect(learner.latestQuizAttemptId).to.be.null;
            }

            if (learner.latestQuizAttemptId !== null) {
                expect(learner.latestQuizAttemptId).to.be.a('number');
                expect(learner.latestQuizAttemptId).to.be.at.least(1);
                expect(Number.isInteger(learner.latestQuizAttemptId)).to.be.true;
            } else {
                expect(learner.latestQuizAttemptId).to.be.null;
            }

            if (learner.latestQuizAttemptTime !== null) {
                expect(learner.latestQuizAttemptTime).to.be.a('number');
                expect(learner.latestQuizAttemptTime).to.be.at.least(1); // Can't complete a quiz in zero seconds
                expect(Number.isInteger(learner.latestQuizAttemptTime)).to.be.true; // Time in milliseconds
            } else {
                expect(learner.latestQuizAttemptTime).to.be.null;
            }
        });

        // Question data validation
        expect(result.questions).to.be.an('array');
    }

    /**
     * Runs a test case for invalid inputs/context, ensuring an error is thrown
     */
    async function invalidCase(courseId: any, errorMessage: string, errType: ErrorType | undefined = undefined, adminCall: boolean = true) {
        try {
            await callAPI('get-course-insight-report', { courseId }, adminCall);
            expect.fail("Expected an error but didn't get one");
        } catch (error: any) {
            const validationParams: ValidationParams = {
                endpoint: "get-course-insight-report",
                ...errType && { type: errType },
                request_user_id: adminCall ? Constants.users.AdminUUID : Constants.users.LearnerUUID,
                payload: { courseId },
                message: errorMessage
            };

            validateError(error, validationParams);
        }
    }

    suite("Sanity", function() {
        test("Basic course without enrollments", async function() {
            const courseId = await TestCourseGenerator.generateDummyCourse();

            await validCase(courseId);
        });

        test("", async function() {

        });
    });

    suite("Detailed", function() {

        sanitySkipDetailed();

        test("Non-Admin call", async function() {
            const courseId = await TestCourseGenerator.generateDummyCourse();

            await invalidCase(courseId, `Only administrators may call get-course-insight-report`, "PERMISSION", false);
        });

        test("", async function() {

        });

        test("", async function() {

        });

        test("", async function() {

        });

        test("", async function() {

        });

        test("", async function() {

        });

        test("", async function() {

        });

        test("", async function() {

        });
    });
});
