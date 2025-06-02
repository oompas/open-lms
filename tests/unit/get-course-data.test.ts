import { expect } from 'chai';
import { callAPI } from "../helpers/api.ts";
import { sanitySkipDetailed, setupWipeDb } from "../helpers/mocha.ts";
import TestCourseGenerator from "../helpers/generators/CourseGenerator.ts";
import { ErrorType, validateError, ValidationParams } from "../helpers/errors.ts";
import Constants from "../helpers/constants.ts";
import { CourseStatus } from "../helpers/enum/CourseStatus.ts";

suite("getCourseData", function() {

    setupWipeDb();

    /**
     * Runs a test for valid inputs & context, ensuring the endpoint works properly
     */
    async function validCase(courseId: number, adminView: boolean = false): Promise<any> {
        const result = await callAPI('get-course-data', { courseId, adminView }, adminView);
        expect(result).to.be.an('object');
        expect(result.id).to.equal(courseId);
        expect(result.name).to.be.a('string');
        expect(result.description).to.be.a('string');
        expect(result.link).to.be.a('string');

        return result;
    }

    /**
     * Runs a test case for invalid inputs/context, ensuring an error is thrown
     */
    async function invalidCase(payload: any, errorMessage: string, errType: ErrorType | undefined = undefined, adminCall: boolean = false) {
        try {
            await callAPI('get-course-data', payload, adminCall);
            expect.fail("Expected an error but didn't get one");
        } catch (error: any) {
            const validationParams: ValidationParams = {
                endpoint: "get-course-data",
                ...errType && { type: errType },
                request_user_id: adminCall ? Constants.users.AdminUUID : Constants.users.LearnerUUID,
                payload: payload,
                message: errorMessage
            };

            validateError(error, validationParams);
        }
    }

    suite("Sanity", function() {
        test("Get course data as learner", async function() {
            const courseId = await TestCourseGenerator.generateDummyCourse();

            // Enroll in the course first
            await callAPI('course-enrollment', { courseId }, false);

            const result = await validCase(courseId);
            expect(result.status).to.equal(CourseStatus.ENROLLED);
            expect(result).to.have.property('quizData');
            expect(result).to.have.property('courseAttempt');
            expect(result).to.have.property('quizAttempts');
        });

        test("Get course data as admin", async function() {
            const courseId = await TestCourseGenerator.generateDummyCourse();

            const result = await validCase(courseId, true);
            expect(result).to.have.property('quizData');
            expect(result).to.have.property('quizQuestions');
            expect(result.quizQuestions).to.be.an('array');
        });
    });


    suite("Detailed", function() {

        sanitySkipDetailed();

        test("Get data for non-enrolled course", async function() {
            const courseId = await TestCourseGenerator.generateDummyCourse();

            const result = await validCase(courseId);
            expect(result.status).to.equal(CourseStatus.NOT_ENROLLED);
        });

        test("Get data for inactive course", async function() {
            const courseId = await TestCourseGenerator.generateDummyCourse(false);

            await invalidCase({ courseId, adminView: false }, `Course with id '${courseId}' is inactive`, "INPUT");
        });

        test("Get data for non-existent course", async function() {
            const nonExistentCourseId = 999_999_999;

            await invalidCase({ courseId: nonExistentCourseId, adminView: false }, `Course with id '${nonExistentCourseId}' does not exist`, "INPUT");
        });

        test("Get admin view as non-admin", async function() {
            const courseId = await TestCourseGenerator.generateDummyCourse();

            await invalidCase({ courseId, adminView: true }, "Requesting user must be an admin for course data's adminView", "PERMISSION");
        });

        test("Handle invalid course ID types", async function() {
            await invalidCase({ courseId: "1", adminView: false }, "Payload validation failed: Expected number, received string", "VALIDATION");
            await invalidCase({ courseId: null, adminView: false  }, "Payload validation failed: Expected number, received null", "VALIDATION");
            await invalidCase({ courseId: -1, adminView: false }, "Payload validation failed: Number must be greater than or equal to 1", "VALIDATION");
        });

        test("Handle missing course ID", async function() {
            await invalidCase({ adminView: false }, "Payload validation failed: Required", "VALIDATION");
        });

        test("Admin view shows quiz questions", async function() {
            const courseId = await TestCourseGenerator.generateDummyCourse();

            const result = await validCase(courseId, true);
            expect(result.quizQuestions).to.be.an('array');

            if (result.quizQuestions.length > 0) {
                const question = result.quizQuestions[0];
                expect(question).to.have.property('id');
                expect(question).to.have.property('type');
                expect(question).to.have.property('question');
                expect(question).to.have.property('marks');
                expect(question).to.have.property('order');
            }
        });
    });
});
