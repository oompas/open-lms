import { expect } from 'chai';
import { callAPI } from "../helpers/api.ts";
import { sanitySkipDetailed, setupWipeDb } from "../helpers/mocha.ts";
import TestCourseGenerator from "../helpers/generators/CourseGenerator.ts";
import Constants from "../helpers/constants.ts";
import { CourseStatus } from "../helpers/Enum/CourseStatus.ts";

suite("get-courses", function() {

    setupWipeDb();

    /**
     * Helper function to validate the structure of a course object returned by get-courses
     */
    function validateCourseStructure(course: any) {
        expect(course).to.be.an('object');
        expect(course).to.have.all.keys(['id', 'name', 'description', 'status', 'minTime', 'total_quiz_marks']);

        expect(course.id).to.be.a('number');
        expect(course.name).to.be.a('string');
        expect(course.description).to.be.a('string');
        expect(course.status).to.be.a('string');
        expect(course.minTime).to.satisfy((val: any) => val === null || typeof val === 'number');
        expect(course.total_quiz_marks).to.be.a('number');

        // Validate status is one of the expected values
        expect(Object.values(Constants.courseStatus)).to.include(course.status);
    }

    /**
     * Helper function to create multiple courses with different enrollment states
     */
    async function setupCoursesWithDifferentStates() {
        const courseIds = await TestCourseGenerator.generateDummyCourses(4);

        // Course 1: Not enrolled (default state)
        const notEnrolledCourseId = courseIds[0];

        // Course 2: Enrolled
        const enrolledCourseId = courseIds[1];
        await callAPI('course-enrollment', { courseId: enrolledCourseId }, false);

        // Course 3: In progress (start course)
        const inProgressCourseId = courseIds[2];
        await callAPI('course-enrollment', { courseId: inProgressCourseId }, false);
        await callAPI('start-course', { courseId: inProgressCourseId }, false);

        // Course 4: Inactive (should not appear in results)
        const inactiveCourseId = courseIds[3];
        await callAPI('set-course-visibility', { courseId: inactiveCourseId, active: false }, true);

        return {
            notEnrolledCourseId,
            enrolledCourseId,
            inProgressCourseId,
            inactiveCourseId,
            allActiveCourseIds: [notEnrolledCourseId, enrolledCourseId, inProgressCourseId]
        };
    }

    suite("Sanity", function() {

        test("No courses (learner)", async function() {
            const result = await callAPI('get-courses', {}, false);

            expect(result).to.be.an('array');
            expect(result).to.deep.equal([]);
        });

        test("No courses (admin)", async function() {
            const result = await callAPI('get-courses', {}, true);

            expect(result).to.be.an('array');
            expect(result).to.deep.equal([]);
        });

        test("Single active course - not enrolled", async function() {
            const courseId = await TestCourseGenerator.generateDummyCourse();

            const result = await callAPI('get-courses', {}, false);

            expect(result).to.be.an('array');
            expect(result).to.have.lengthOf(1);

            const course = result[0];
            validateCourseStructure(course);
            expect(course.id).to.equal(courseId);
            expect(course.status).to.equal(CourseStatus.NOT_ENROLLED);
        });

        test("Single active course - enrolled", async function() {
            const courseId = await TestCourseGenerator.generateDummyCourse();
            await callAPI('course-enrollment', { courseId }, false);

            const result = await callAPI('get-courses', {}, false);

            expect(result).to.be.an('array');
            expect(result).to.have.lengthOf(1);

            const course = result[0];
            validateCourseStructure(course);
            expect(course.id).to.equal(courseId);
            expect(course.status).to.equal(CourseStatus.ENROLLED);
        });
    });

    suite("Detailed", function() {

        sanitySkipDetailed();

        test("Multiple courses with different enrollment states", async function() {
            const { notEnrolledCourseId, enrolledCourseId, inProgressCourseId, allActiveCourseIds } =
                await setupCoursesWithDifferentStates();

            const result = await callAPI('get-courses', {}, false);

            expect(result).to.be.an('array');
            expect(result).to.have.lengthOf(3); // Only active courses should be returned

            // Validate all courses have correct structure
            result.forEach(validateCourseStructure);

            // Check that all active course IDs are present
            const returnedIds = result.map((course: any) => course.id);
            expect(returnedIds).to.have.members(allActiveCourseIds);

            // Find specific courses and validate their statuses
            const notEnrolledCourse = result.find((c: any) => c.id === notEnrolledCourseId);
            const enrolledCourse = result.find((c: any) => c.id === enrolledCourseId);
            const inProgressCourse = result.find((c: any) => c.id === inProgressCourseId);

            expect(notEnrolledCourse.status).to.equal(CourseStatus.NOT_ENROLLED);
            expect(enrolledCourse.status).to.equal(CourseStatus.ENROLLED);
            expect(inProgressCourse.status).to.equal(CourseStatus.IN_PROGRESS);
        });

        test("Inactive courses are not returned", async function() {
            const activeCourseId = await TestCourseGenerator.generateDummyCourse();
            const inactiveCourseId = await TestCourseGenerator.generateDummyCourse(false);

            const result = await callAPI('get-courses', {}, false);

            expect(result).to.be.an('array');
            expect(result).to.have.lengthOf(1);
            expect(result[0].id).to.equal(activeCourseId);
        });

        test("Admin and learner see same courses", async function() {
            const courseIds = await TestCourseGenerator.generateDummyCourses(3);

            const learnerResult = await callAPI('get-courses', {}, false);
            const adminResult = await callAPI('get-courses', {}, true);

            expect(learnerResult).to.be.an('array');
            expect(adminResult).to.be.an('array');
            expect(learnerResult).to.have.lengthOf(3);
            expect(adminResult).to.have.lengthOf(3);

            // Both should return the same course IDs
            const learnerIds = learnerResult.map((c: any) => c.id).sort();
            const adminIds = adminResult.map((c: any) => c.id).sort();
            expect(learnerIds).to.deep.equal(adminIds);
        });

        test("Course data fields are correctly populated", async function() {
            const courseId = await TestCourseGenerator.generateDummyCourse();

            // Get the course data to compare
            const courseData = await callAPI('get-course-data', { courseId, adminView: true }, true);

            const result = await callAPI('get-courses', {}, false);
            const course = result[0];

            expect(course.id).to.equal(courseData.id);
            expect(course.name).to.equal(courseData.name);
            expect(course.description).to.equal(courseData.description);
            expect(course.minTime).to.equal(courseData.minTime);
            expect(course.total_quiz_marks).to.equal(courseData.quizData.totalMarks);
        });

        test("Large number of courses", async function() {
            const numberOfCourses = 15;
            const courseIds = await TestCourseGenerator.generateDummyCourses(numberOfCourses);

            // Enroll in some courses to create variety
            for (let i = 0; i < 5; i++) {
                await callAPI('course-enrollment', { courseId: courseIds[i] }, false);
            }

            const result = await callAPI('get-courses', {}, false);

            expect(result).to.be.an('array');
            expect(result).to.have.lengthOf(numberOfCourses);

            // Validate all courses
            result.forEach(validateCourseStructure);

            // Check that we have the expected mix of statuses
            const statuses = result.map((c: any) => c.status);
            expect(statuses).to.include(CourseStatus.NOT_ENROLLED);
            expect(statuses).to.include(CourseStatus.ENROLLED);
        });

        test("Courses with null minTime", async function() {
            // The generator creates courses with random minTime (including null)
            const courseIds = await TestCourseGenerator.generateDummyCourses(5);

            const result = await callAPI('get-courses', {}, false);

            expect(result).to.be.an('array');
            expect(result).to.have.lengthOf(5);

            // Validate that minTime can be null and is handled correctly
            result.forEach((course: any) => {
                validateCourseStructure(course);
                if (course.minTime !== null) {
                    expect(course.minTime).to.be.a('number');
                    expect(course.minTime).to.be.at.least(0);
                }
            });
        });

        test("Function is idempotent", async function() {
            const numCourses = 20;
            const numCalls = 10;

            await TestCourseGenerator.generateDummyCourses(numCourses);

            const results = [];
            for (let i = 0; i < numCalls; ++i) {
                const result = await callAPI('get-courses', {}, false);

                expect(result).to.be.an('array');
                expect(result).to.have.lengthOf(numCourses);
                results.push(result);
            }

            // Verify all results are equal
            for (let i = 0; i < results.length; ++i) {
                for (let j = i + 1; j < results.length; ++j) {
                    expect(results[i]).to.deep.equal(results[j]);
                }
            }
        });
    });
});
