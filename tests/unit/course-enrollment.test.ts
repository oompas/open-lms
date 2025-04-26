import { expect } from 'chai';
import { callAPI } from "../helpers/api.ts";
import { sanitySkipDetailed, setupWipeDb } from "../helpers/mocha.ts";
import TestCourseGenerator from "../helpers/generators/CourseGenerator.ts";

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
    async function invalidCase(courseId: any, errorMessage: string, adminCall: boolean = false) {
        try {
            await callAPI('course-enrollment', { courseId }, adminCall);
            expect.fail("Expected an error but did not get one");
        } catch (error: any) {
            expect(error.message).to.include(errorMessage);
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

        test("Handle non-existent course ID", async function() {
            const nonExistentCourseId = "non-existent-course-id";

            await invalidCase(nonExistentCourseId, "");
        });

        test("Handle no course id", async function() {
            await invalidCase(null, "");
        });
    });
});
