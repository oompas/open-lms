import { expect } from 'chai';
import { callAPI } from "../helpers/api.ts";
import { sanitySkipDetailed, setupWipeDb } from "../helpers/mocha.ts";
import TestCourseGenerator from "../helpers/generators/CourseGenerator.ts";

suite("set-course-visibility", function() {

    setupWipeDb();

    /**
     * Updates the course visibility as desired, verifying the result
     */
    async function updateVisibilityAndVerify(courseId: number, active: boolean): Promise<void> {
        await callAPI('set-course-visibility', { courseId, active }, true);

        const updatedCourse = await callAPI('get-course-data', { courseId, adminView: true }, true);
        expect(updatedCourse.active).to.equal(active);
    }

    /**
     * Tests invalid input, verifying an error is thrown
     */
    async function failureCase(payload: object, expectedError: string, admin = true): Promise<void> {
        try {
            await callAPI('set-course-visibility', payload, admin);
            expect.fail("Expected an error but did not get one");
        } catch (error) {}
    }

    suite("Sanity", function() {
        test("Deactivate course", async function() {
            const courseId = await TestCourseGenerator.generateDummyCourse();

            await updateVisibilityAndVerify(courseId, false);
        });

        test("Deactivate and reactivate course", async function() {
            const courseId = await TestCourseGenerator.generateDummyCourse();

            await updateVisibilityAndVerify(courseId, false);
            await updateVisibilityAndVerify(courseId, true);
        });
    });

    suite("Detailed", function() {

        sanitySkipDetailed();

        test("Repeatedly activate/deactivate course", async function() {
            const repetitions = 10;
            const courseId = await TestCourseGenerator.generateDummyCourse();

            for (let i = 0; i < repetitions; ++i) {
                await updateVisibilityAndVerify(courseId, false);
                await updateVisibilityAndVerify(courseId, true);
            }
        });

        test("Deactivate/active multiple courses", async function() {
            const courseIds: number[] = await TestCourseGenerator.generateDummyCourses(10);

            for (let courseId of courseIds) {
                await updateVisibilityAndVerify(courseId, false);
                await updateVisibilityAndVerify(courseId, true);
            }
        });

        test("Activate already active course", async function() {
            const courseId = await TestCourseGenerator.generateDummyCourse();

            await failureCase({ courseId, active: true }, `The course with ID ${courseId} is already active`);
        });

        test("Deactivate already inactive course", async function() {
            const courseId = await TestCourseGenerator.generateDummyCourse();
            await updateVisibilityAndVerify(courseId, false);

            await failureCase({ courseId, active: false }, `The course with ID ${courseId} is already inactive`);
        });

        test("Non-existent course ID", async function() {
            const nonExistentCourseId = -1;

            await failureCase({ courseId: nonExistentCourseId, active: false }, `Error updating course with ID ${nonExistentCourseId}`);
        });

        test("No course ID", async function() {
            await failureCase({ active: false }, "Invalid input");
        });

        test("No active status provided", async function() {
            const courseId = await TestCourseGenerator.generateDummyCourse();

            await failureCase({ courseId }, "Invalid input");
        });

        test("No parameters provided", async function() {
            await failureCase({}, "Invalid input");
        });

        test("Non-numeric course ID", async function() {
            const active = true;

            await failureCase({ courseId: "invalid", active }, "Invalid input");
        });

        test("Non-boolean active parameter", async function() {
            const courseId = await TestCourseGenerator.generateDummyCourse();

            await failureCase({ courseId, active: "invalid" }, "Invalid input");
        });

        test("Non-admin call", async function() {
            const courseId = await TestCourseGenerator.generateDummyCourse();

            await failureCase({ courseId, active: false }, "Only administrators may call this endpoint");
        });
    });
});
