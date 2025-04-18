import { expect } from 'chai';
import { callAPI } from "../helpers/api.ts";
import { sanitySkipDetailed, setupWipeDb } from "../helpers/mocha.ts";
import TestCourseGenerator from "../helpers/generators/CourseGenerator.ts";

suite("set-course-visibility", function() {

    setupWipeDb();

    async function updateVisibilityAndVerify(courseId: number, active: boolean) {
        await callAPI('set-course-visibility', { courseId, active }, true);

        const updatedCourse = await callAPI('get-course-data', { courseId, adminView: true }, true);
        expect(updatedCourse.active).to.equal(active);
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

            try {
                await callAPI('set-course-visibility', { courseId, active: true }, true);
                expect.fail("Expected an error but did not get one");
            } catch (error: any) {
                expect(error.message).to.include(`The course with ID ${courseId} is already active`);
            }
        });

        test("Deactivate already inactive course", async function() {
            const courseId = await TestCourseGenerator.generateDummyCourse();
            await updateVisibilityAndVerify(courseId, false);

            try {
                await callAPI('set-course-visibility', { courseId, active: false }, true);
                expect.fail("Expected an error but did not get one");
            } catch (error: any) {
                expect(error.message).to.include(`The course with ID ${courseId} is already inactive`);
            }
        });

        test("Non-existent course ID", async function() {
            const nonExistentCourseId = -1;

            try {
                await callAPI('set-course-visibility', { courseId: nonExistentCourseId, active: false }, true);
                expect.fail("Expected an error but did not get one");
            } catch (error: any) {
                expect(error.message).to.include(`Error updating course with ID ${nonExistentCourseId}`);
            }
        });

        test("No course ID", async function() {
            try {
                await callAPI('set-course-visibility', { active: false }, true);
                expect.fail("Expected an error but did not get one");
            } catch (error: any) {
                expect(error.message).to.include("Invalid input");
            }
        });

        test("No active status provided", async function() {
            const courseId = await TestCourseGenerator.generateDummyCourse();

            try {
                await callAPI('set-course-visibility', { courseId }, true);
                expect.fail("Expected an error but did not get one");
            } catch (error: any) {
                expect(error.message).to.include("Invalid input");
            }
        });

        test("No parameters provided", async function() {
            try {
                await callAPI('set-course-visibility', {}, true);
                expect.fail("Expected an error but did not get one");
            } catch (error: any) {
                expect(error.message).to.include("Invalid input");
            }
        });

        test("Non-numeric course ID", async function() {
            const active = true;

            try {
                await callAPI('set-course-visibility', { courseId: "invalid", active }, true);
                expect.fail("Expected an error but did not get one");
            } catch (error: any) {
                expect(error.message).to.include("Invalid input");
            }
        });

        test("Non-boolean active parameter", async function() {
            const courseId = await TestCourseGenerator.generateDummyCourse();

            try {
                await callAPI('set-course-visibility', { courseId, active: "invalid" }, true);
                expect.fail("Expected an error but did not get one");
            } catch (error: any) {
                expect(error.message).to.include("Invalid input");
            }
        });
    });
});
