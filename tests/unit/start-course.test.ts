import { expect } from 'chai';
import { callAPI } from "../helpers/api.ts";
import { sanitySkipDetailed, setupWipeDb } from "../helpers/mocha.ts";
import TestCourseGenerator from "../helpers/generators/CourseGenerator.ts";
import { ErrorType, validateError, ValidationParams } from "../helpers/errors.ts";
import Constants from "../helpers/constants.ts";

suite("start-course", function() {

    setupWipeDb();

    /**
     * Helper function to set up a course in enrolled state ready to be started
     */
    async function setupEnrolledCourse(adminCall: boolean = false): Promise<number> {
        const courseId = await TestCourseGenerator.generateDummyCourse();
        await callAPI('course-enrollment', { courseId }, adminCall);
        return courseId;
    }

    /**
     * Helper function to verify course status after starting
     */
    async function verifyCourseStatus(courseId: number, expectedStatus: Constants.enums.CourseStatus, adminCall: boolean = false) {
        const courses = await callAPI('get-courses', {}, adminCall);
        const course = courses.find((c: any) => c.id === courseId);
        expect(course).to.exist;
        expect(course.status).to.equal(expectedStatus);
    }

    /**
     * Runs a test for valid inputs & context, ensuring the endpoint works properly
     */
    async function validCase(courseId: number, adminCall: boolean = false): Promise<void> {
        const result = await callAPI('start-course', { courseId }, adminCall);
        expect(result).to.be.null;

        // Verify the course status changed to IN_PROGRESS
        await verifyCourseStatus(courseId, Constants.enums.CourseStatus.IN_PROGRESS, adminCall);
    }

    /**
     * Runs a test case for invalid inputs/context, ensuring an error is thrown
     */
    async function invalidCase(courseId: any, errorMessage: string, errType: ErrorType | undefined = undefined, adminCall: boolean = false) {
        try {
            await callAPI('start-course', { courseId }, adminCall);
            expect.fail("Expected an error but didn't get one");
        } catch (error: any) {
            const validationParams: ValidationParams = {
                endpoint: "start-course",
                ...errType && { type: errType },
                request_user_id: adminCall ? Constants.users.AdminUUID : Constants.users.LearnerUUID,
                payload: { courseId },
                message: errorMessage
            };

            validateError(error, validationParams);
        }
    }

    suite("Sanity", function() {

        test("Start an enrolled course", async function() {
            const courseId = await setupEnrolledCourse();
            await validCase(courseId);
        });

        test("Admin starts an enrolled course", async function() {
            const courseId = await setupEnrolledCourse(true);
            await validCase(courseId, true);
        });

        test("Start course that is already started", async function() {
            const courseId = await setupEnrolledCourse();

            // Start the course first time
            await validCase(courseId);

            // Starting again should still work (idempotent)
            await validCase(courseId);
        });

    });

    suite("Detailed", function() {

        sanitySkipDetailed();

        test("Start multiple courses for same user", async function() {
            const courseIds = await TestCourseGenerator.generateDummyCourses(3);

            // Enroll in all courses
            for (const courseId of courseIds) {
                await callAPI('course-enrollment', { courseId }, false);
            }

            // Start all courses
            for (const courseId of courseIds) {
                await validCase(courseId);
            }

            // Verify all courses are in progress
            for (const courseId of courseIds) {
                await verifyCourseStatus(courseId, Constants.enums.CourseStatus.IN_PROGRESS);
            }
        });

        test("Multiple users start the same course", async function() {
            const courseId = await TestCourseGenerator.generateDummyCourse();

            // Learner enrolls and starts
            await callAPI('course-enrollment', { courseId }, false);
            await validCase(courseId, false);

            // Admin enrolls and starts the same course
            await callAPI('course-enrollment', { courseId }, true);
            await validCase(courseId, true);
        });

        test("Start course creates course attempt", async function() {
            const courseId = await setupEnrolledCourse();

            // Start the course
            await callAPI('start-course', { courseId }, false);

            // Verify we can start a quiz (which requires a course attempt)
            const quizAttempt = await callAPI('start-quiz', { courseId }, false);
            expect(quizAttempt).to.be.an('object');
            expect(quizAttempt.id).to.be.a('number');
        });

        test("Start course updates enrollment status", async function() {
            const courseId = await setupEnrolledCourse();

            // Verify initial status is ENROLLED
            await verifyCourseStatus(courseId, Constants.enums.CourseStatus.ENROLLED);

            // Start the course
            await callAPI('start-course', { courseId }, false);

            // Verify status changed to IN_PROGRESS
            await verifyCourseStatus(courseId, Constants.enums.CourseStatus.IN_PROGRESS);
        });

        test("Cannot start course that doesn't exist", async function() {
            const nonExistentCourseId = 99999;

            await invalidCase(nonExistentCourseId, "Course not found or user not enrolled", "LOGIC");
        });

        test("Cannot start course without enrollment", async function() {
            const courseId = await TestCourseGenerator.generateDummyCourse();

            // Don't enroll, just try to start
            await invalidCase(courseId, "Course not found or user not enrolled", "LOGIC");
        });

        test("Cannot start inactive course", async function() {
            const courseId = await TestCourseGenerator.generateDummyCourse();

            // Enroll first
            await callAPI('course-enrollment', { courseId }, false);

            // Deactivate the course
            await callAPI('set-course-visibility', { courseId, active: false }, true);

            // Try to start the inactive course
            await invalidCase(courseId, "Course not found or user not enrolled", "LOGIC");
        });

        test("Handle zero course ID", async function() {
            const invalidCourseId = 0;

            await invalidCase(invalidCourseId, "Payload validation failed: Number must be greater than or equal to 1", "VALIDATION");
        });

        test("Handle negative course ID", async function() {
            const invalidCourseId = -123;

            await invalidCase(invalidCourseId, "Payload validation failed: Number must be greater than or equal to 1", "VALIDATION");
        });

        test("Handle string course ID", async function() {
            const invalidCourseId = "1";

            await invalidCase(invalidCourseId, "Payload validation failed: Expected number, received string", "VALIDATION");
        });

        test("Handle null course ID", async function() {
            await invalidCase(null, "Payload validation failed: Expected number, received null", "VALIDATION");
        });

        test("Handle undefined course ID", async function() {
            await invalidCase(undefined, "Payload validation failed: Required", "VALIDATION");
        });

        test("Handle missing courseId in payload", async function() {
            try {
                await callAPI('start-course', {}, false);
                expect.fail("Expected an error but didn't get one");
            } catch (error: any) {
                const validationParams: ValidationParams = {
                    endpoint: "start-course",
                    type: "VALIDATION",
                    request_user_id: Constants.users.LearnerUUID,
                    payload: {},
                    message: "Payload validation failed: Required"
                };

                validateError(error, validationParams);
            }
        });

        test("Handle extra fields in payload", async function() {
            const courseId = await setupEnrolledCourse();

            // Should work even with extra fields
            const result = await callAPI('start-course', {
                courseId,
                extraField: "should be ignored"
            }, false);

            expect(result).to.be.null;
            await verifyCourseStatus(courseId, Constants.enums.CourseStatus.IN_PROGRESS);
        });

        test("Start course after unenrolling and re-enrolling", async function() {
            const courseId = await TestCourseGenerator.generateDummyCourse();

            // Enroll, start, then unenroll
            await callAPI('course-enrollment', { courseId }, false);
            await callAPI('start-course', { courseId }, false);
            await callAPI('course-enrollment', { courseId }, false); // Unenroll

            // Re-enroll and start again
            await callAPI('course-enrollment', { courseId }, false);
            await validCase(courseId);
        });

        test("Start course with decimal course ID", async function() {
            const invalidCourseId = 1.5;

            await invalidCase(invalidCourseId, "Payload validation failed: Expected integer, received float", "VALIDATION");
        });

        test("Start course with very large course ID", async function() {
            const largeCourseId = Number.MAX_SAFE_INTEGER;

            await invalidCase(largeCourseId, "Course not found or user not enrolled", "LOGIC");
        });

        test("Concurrent course starts", async function() {
            const courseIds = await TestCourseGenerator.generateDummyCourses(3);

            // Enroll in all courses
            for (const courseId of courseIds) {
                await callAPI('course-enrollment', { courseId }, false);
            }

            // Start all courses concurrently
            const startPromises = courseIds.map(courseId =>
                callAPI('start-course', { courseId }, false)
            );

            const results = await Promise.all(startPromises);

            // All should succeed
            results.forEach(result => expect(result).to.be.null);

            // Verify all courses are in progress
            for (const courseId of courseIds) {
                await verifyCourseStatus(courseId, Constants.enums.CourseStatus.IN_PROGRESS);
            }
        });

        test("Start course preserves other course statuses", async function() {
            const courseIds = await TestCourseGenerator.generateDummyCourses(3);

            // Set up different states
            // Course 1: Just enrolled
            await callAPI('course-enrollment', { courseId: courseIds[0] }, false);

            // Course 2: Started (in progress)
            await callAPI('course-enrollment', { courseId: courseIds[1] }, false);
            await callAPI('start-course', { courseId: courseIds[1] }, false);

            // Course 3: Not enrolled
            // (courseIds[2] remains not enrolled)

            // Start course 1
            await callAPI('start-course', { courseId: courseIds[0] }, false);

            // Verify statuses
            const courses = await callAPI('get-courses', {}, false);
            const course0 = courses.find((c: any) => c.id === courseIds[0]);
            const course1 = courses.find((c: any) => c.id === courseIds[1]);
            const course2 = courses.find((c: any) => c.id === courseIds[2]);

            expect(course0.status).to.equal(Constants.enums.CourseStatus.IN_PROGRESS);
            expect(course1.status).to.equal(Constants.enums.CourseStatus.IN_PROGRESS);
            expect(course2.status).to.equal(Constants.enums.CourseStatus.NOT_ENROLLED);
        });

        test("Start course after completing another course", async function() {
            const courseIds = await TestCourseGenerator.generateDummyCourses(2);

            // Enroll in both courses
            await callAPI('course-enrollment', { courseId: courseIds[0] }, false);
            await callAPI('course-enrollment', { courseId: courseIds[1] }, false);

            // Start and complete first course
            await callAPI('start-course', { courseId: courseIds[0] }, false);
            const quizAttempt = await callAPI('start-quiz', { courseId: courseIds[0] }, false);
            await callAPI('submit-quiz', {
                quizAttemptId: quizAttempt.id,
                answers: []
            }, false);

            // Start second course
            await validCase(courseIds[1]);

            // Verify second course is in progress
            await verifyCourseStatus(courseIds[1], Constants.enums.CourseStatus.IN_PROGRESS);
        });

        test("Empty payload object", async function() {
            try {
                await callAPI('start-course', {}, false);
                expect.fail("Expected an error but didn't get one");
            } catch (error: any) {
                const validationParams: ValidationParams = {
                    endpoint: "start-course",
                    type: "VALIDATION",
                    message: "Payload validation failed: Required"
                };

                validateError(error, validationParams);
            }
        });

        test("Start course with boolean courseId", async function() {
            const invalidCourseId = true;

            await invalidCase(invalidCourseId, "Payload validation failed: Expected number, received boolean", "VALIDATION");
        });

        test("Start course with array courseId", async function() {
            const invalidCourseId = [1, 2, 3];

            await invalidCase(invalidCourseId, "Payload validation failed: Expected number, received array", "VALIDATION");
        });

        test("Start course with object courseId", async function() {
            const invalidCourseId = { id: 1 };

            await invalidCase(invalidCourseId, "Payload validation failed: Expected number, received object", "VALIDATION");
        });

    });
});
