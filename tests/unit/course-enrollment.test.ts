import { expect } from 'chai';
import { callAPI } from "../helpers/api.ts";
import { sanitySkipDetailed, setupWipeDb } from "../helpers/mocha.ts";
import TestCourseGenerator from "../helpers/generators/CourseGenerator.ts";
import { ErrorType, validateError, ValidationParams } from "../helpers/errors.ts";
import Constants from "../helpers/constants.ts";

suite("courseEnrollment", function() {

    setupWipeDb();

    /**
     * Runs a test for valid inputs & context, ensuring the endpoint works properly
     */
    async function validCase(courseId: number, adminCall: boolean = false): Promise<void> {
        const result = await callAPI('course-enrollment', { courseId }, adminCall);
        expect(result).to.be.null;
    }

    /**
     * Runs a test case for invalid inputs/context, ensuring an error is thrown
     */
    async function invalidCase(courseId: any, errorMessage: string, errType: ErrorType | undefined = undefined, adminCall: boolean = false) {
        try {
            await callAPI('course-enrollment', { courseId }, adminCall);
            expect.fail("Expected an error but didn't get one");
        } catch (error: any) {
            const validationParams: ValidationParams = {
                endpoint: "course-enrollment",
                ...errType && { type: errType },
                request_user_id: adminCall ? Constants.users.AdminUUID : Constants.users.LearnerUUID,
                payload: { courseId },
                message: errorMessage
            };
            if (errType !== undefined) {
                validationParams.type = errType as ErrorType;
            }

            validateError(error, validationParams);
        }
    }

    suite("Sanity", function() {
        test("Enroll a user", async function() {
            const courseId = await TestCourseGenerator.generateDummyCourse();

            await validCase(courseId);
        });

        test("Unenroll a user", async function() {
            const courseId = await TestCourseGenerator.generateDummyCourse();

            await validCase(courseId);
            await validCase(courseId);
        });
    });

    suite("Detailed", function() {

        sanitySkipDetailed();

        test("Enroll multiple users", async function() {
            const courseId = await TestCourseGenerator.generateDummyCourse();

            await validCase(courseId); // Enroll learner
            await validCase(courseId, true); // Enroll admin
        });

        test("Enroll and unenroll from multiple courses", async function() {
            const courseIds = await TestCourseGenerator.generateDummyCourses(5);

            // Enroll in each course
            for (const courseId of courseIds) {
                await validCase(courseId);
            }

            // Unenroll from each course
            for (const courseId of courseIds) {
                await validCase(courseId);
            }
        });

        test("Handle zero course ID", async function() {
            const nonExistentCourseId = 0;

            await invalidCase(nonExistentCourseId, "Payload validation failed: Number must be greater than or equal" +
                " to 1", "VALIDATION");
        });

        test("Handle negative course ID", async function() {
            const nonExistentCourseId = -123;

            await invalidCase(nonExistentCourseId, "Payload validation failed: Number must be greater than or equal" +
                " to 1", "VALIDATION");
        });

        test("Handle string course ID", async function() {
            const nonExistentCourseId = "1";

            await invalidCase(nonExistentCourseId, "Payload validation failed: Expected number, received string", "VALIDATION");
        });

        test("Handle no course id", async function() {
            await invalidCase(null, "Payload validation failed: Expected number, received null", "VALIDATION");
        });
    });
});
