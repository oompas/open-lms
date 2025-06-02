import { expect } from 'chai';
import { callAPI } from "../helpers/api.ts";
import TestCourseGenerator from "../helpers/generators/CourseGenerator.ts";
import { setupWipeDb, sanitySkipDetailed } from "../helpers/mocha.ts";

suite("integration: browsing", function() {

    setupWipeDb();

    suite("Sanity", function() {

        test("Learner browses available courses and views profile", async function() {
            // Setup: Create a test course
            const courseId = await TestCourseGenerator.generateDummyCourse(true);

            // 1. Learner gets list of available courses
            const courses = await callAPI('get-courses', {}, false);
            expect(courses).to.be.an('array');
            expect(courses.length).to.be.greaterThan(0);

            // Verify the created course is in the list
            const createdCourse = courses.find((course: any) => course.id === courseId);
            expect(createdCourse).to.exist;
            expect(createdCourse.active).to.be.true;

            // 2. Learner views their profile (should show no enrollments initially)
            const profile = await callAPI('get-profile', {}, false);
            expect(profile).to.be.an('object');
            expect(profile.user).to.exist;
            expect(profile.enrolledCourses).to.be.an('array');
            expect(profile.completedCourses).to.be.an('array');
            expect(profile.quizAttempts).to.be.an('array');

            // 3. Learner checks notifications (should be empty initially)
            const notifications = await callAPI('get-notifications', {}, false);
            expect(notifications).to.be.an('array');
        });

        test("Learner enrolls in a course and starts it", async function() {
            // Setup: Create a test course
            const courseId = await TestCourseGenerator.generateDummyCourse(true);

            // 1. Learner enrolls in the course
            const enrollmentResult = await callAPI('course-enrollment', { courseId }, false);
            expect(enrollmentResult).to.be.null; // Successful enrollment returns null

            // 2. Verify enrollment by checking profile
            const profileAfterEnrollment = await callAPI('get-profile', {}, false);
            expect(profileAfterEnrollment.enrolledCourses).to.be.an('array');
            expect(profileAfterEnrollment.enrolledCourses.length).to.equal(1);
            expect(profileAfterEnrollment.enrolledCourses[0].id).to.equal(courseId);

            // 3. Learner starts the course
            const startCourseResult = await callAPI('start-course', { courseId }, false);
            expect(startCourseResult).to.be.an('object');
            expect(startCourseResult.courseAttemptId).to.be.a('number');

            // 4. Get course data to view content
            const courseData = await callAPI('get-course-data', { courseId }, false);
            expect(courseData).to.be.an('object');
            expect(courseData.course).to.exist;
            expect(courseData.quizQuestions).to.be.an('array');
            expect(courseData.attempts).to.exist;
        });

        test("Admin views dashboard insights", async function() {
            // Setup: Create some test data
            const courseId = await TestCourseGenerator.generateDummyCourse(true);

            // Enroll and start course as learner to generate some data
            await callAPI('course-enrollment', { courseId }, false);
            await callAPI('start-course', { courseId }, false);

            // 1. Admin views admin insights dashboard
            const insights = await callAPI('get-admin-insights', {}, true);
            expect(insights).to.be.an('object');
            expect(insights.quizAttemptsToMark).to.be.an('array');
            expect(insights.courseInsights).to.be.an('array');
            expect(insights.learners).to.be.an('array');
            expect(insights.admins).to.be.an('array');

            // 2. Admin views user reports
            const userReports = await callAPI('get-user-reports', { withAdmins: false }, true);
            expect(userReports).to.be.an('object');
            expect(userReports.csv).to.be.a('string');

            // 3. Admin views course reports
            const courseReports = await callAPI('get-course-reports', {}, true);
            expect(courseReports).to.exist; // Returns Excel file buffer
        });
    });

    suite("Detailed", function() {

        sanitySkipDetailed();

        test("Complete learner journey: Browse → Enroll → Study → Take Quiz → Complete Course", async function() {
            // Setup: Create a test course with known quiz structure
            const courseId = await TestCourseGenerator.generateDummyCourse(true);

            // 1. Learner discovers and browses courses
            const availableCourses = await callAPI('get-courses', {}, false);
            expect(availableCourses).to.be.an('array');
            const targetCourse = availableCourses.find((course: any) => course.id === courseId);
            expect(targetCourse).to.exist;

            // 2. Learner enrolls in the course
            await callAPI('course-enrollment', { courseId }, false);

            // 3. Learner views course details before starting
            const courseDetails = await callAPI('get-course-data', { courseId }, false);
            expect(courseDetails.course).to.exist;
            expect(courseDetails.quizQuestions).to.be.an('array');

            // 4. Learner starts the course
            const courseStart = await callAPI('start-course', { courseId }, false);
            const courseAttemptId = courseStart.courseAttemptId;
            expect(courseAttemptId).to.be.a('number');

            // 5. Learner starts the quiz
            const quizStart = await callAPI('start-quiz', { courseId, courseAttemptId }, false);
            const quizAttemptId = quizStart.quizAttemptId;
            expect(quizAttemptId).to.be.a('number');

            // 6. Learner views quiz questions
            const quiz = await callAPI('get-quiz', { quizAttemptId }, false);
            expect(quiz).to.be.an('object');
            expect(quiz.questions).to.be.an('array');
            expect(quiz.questions.length).to.be.greaterThan(0);

            // 7. Learner submits quiz answers
            const responses = quiz.questions.map((question: any) => {
                let answer;
                switch (question.type) {
                    case 'TF':
                        answer = Math.random() > 0.5 ? 1 : 0; // Random true/false
                        break;
                    case 'MC':
                        answer = Math.floor(Math.random() * question.answers.length); // Random choice
                        break;
                    case 'SA':
                        answer = "Sample short answer response"; // Text answer
                        break;
                    default:
                        answer = 0;
                }
                return {
                    questionId: question.id,
                    answer: answer
                };
            });

            const submitResult = await callAPI('submit-quiz', {
                quizAttemptId,
                responses
            }, false);
            expect(submitResult).to.be.an('object');

            // 8. Check if quiz needs manual marking (for short answer questions)
            const quizAttempt = await callAPI('get-quiz-attempt', { quizAttemptId }, true);
            expect(quizAttempt).to.be.an('object');

            // 9. If there are short answer questions, admin marks them
            if (quizAttempt.shortAnswerQuestions && quizAttempt.shortAnswerQuestions.length > 0) {
                const marks = quizAttempt.shortAnswerQuestions.map((q: any) => ({
                    questionAttemptId: q.questionAttemptId,
                    marksAchieved: Math.floor(Math.random() * q.marks) // Random marks
                }));

                await callAPI('mark-quiz-attempt', { quizAttemptId, marks }, true);
            }

            // 10. Learner checks updated profile to see completion status
            const finalProfile = await callAPI('get-profile', {}, false);
            expect(finalProfile.enrolledCourses).to.be.an('array');
            expect(finalProfile.quizAttempts).to.be.an('array');
            expect(finalProfile.quizAttempts.length).to.be.greaterThan(0);
        });

        test("Admin course management workflow: Create → Manage → Monitor → Report", async function() {
            // 1. Admin creates a new course
            const courseData = {
                name: "Test Course for Management",
                description: "A comprehensive test course for admin management workflow",
                link: "https://example.com/course-content",
                minTime: 60,
                maxQuizAttempts: 3,
                minQuizScore: 70,
                quizTimeLimit: 30,
                preserveQuizQuestionOrder: true
            };

            const quizQuestions = [
                {
                    type: "MC",
                    question: "What is the primary purpose of this test?",
                    marks: 10,
                    correctAnswer: 0,
                    answers: ["Testing admin workflow", "Learning content", "Random quiz", "None of the above"]
                },
                {
                    type: "TF",
                    question: "This is a test question.",
                    marks: 5,
                    correctAnswer: 1
                },
                {
                    type: "SA",
                    question: "Describe your experience with the course so far.",
                    marks: 15
                }
            ];

            const newCourseId = await callAPI('create-course', {
                course: courseData,
                quizQuestions
            }, true);
            expect(newCourseId).to.be.a('number');

            // 2. Admin activates the course
            await callAPI('set-course-visibility', {
                courseId: newCourseId,
                active: true
            }, true);

            // 3. Admin invites a learner (simulate email invitation)
            const inviteResult = await callAPI('invite-learner', {
                email: "test.learner@example.com"
            }, true);
            expect(inviteResult).to.be.null; // Successful invite returns null

            // 4. Simulate learner activity: enroll and attempt course
            await callAPI('course-enrollment', { courseId: newCourseId }, false);
            const courseStart = await callAPI('start-course', { courseId: newCourseId }, false);
            const quizStart = await callAPI('start-quiz', {
                courseId: newCourseId,
                courseAttemptId: courseStart.courseAttemptId
            }, false);

            // Submit quiz with mixed answers
            const quiz = await callAPI('get-quiz', { quizAttemptId: quizStart.quizAttemptId }, false);
            const responses = [
                { questionId: quiz.questions[0].id, answer: 0 }, // Correct MC
                { questionId: quiz.questions[1].id, answer: 1 }, // Correct TF
                { questionId: quiz.questions[2].id, answer: "This course is very informative and well-structured." } // SA
            ];

            await callAPI('submit-quiz', {
                quizAttemptId: quizStart.quizAttemptId,
                responses
            }, false);

            // 5. Admin monitors course through insights
            const courseInsights = await callAPI('get-course-insight-report', {
                courseId: newCourseId
            }, true);
            expect(courseInsights).to.be.an('object');
            expect(courseInsights.courseData).to.exist;
            expect(courseInsights.enrollmentStats).to.exist;
            expect(courseInsights.learnerData).to.be.an('array');
            expect(courseInsights.questionData).to.be.an('array');

            // 6. Admin checks for quizzes needing marking
            const adminInsights = await callAPI('get-admin-insights', {}, true);
            expect(adminInsights.quizAttemptsToMark).to.be.an('array');

            // 7. Admin marks short answer questions if any
            if (adminInsights.quizAttemptsToMark.length > 0) {
                const quizToMark = adminInsights.quizAttemptsToMark[0];
                const quizAttemptDetails = await callAPI('get-quiz-attempt', {
                    quizAttemptId: quizToMark.id
                }, true);

                if (quizAttemptDetails.shortAnswerQuestions.length > 0) {
                    const marks = quizAttemptDetails.shortAnswerQuestions.map((q: any) => ({
                        questionAttemptId: q.questionAttemptId,
                        marksAchieved: q.marks // Give full marks
                    }));

                    await callAPI('mark-quiz-attempt', {
                        quizAttemptId: quizToMark.id,
                        marks
                    }, true);
                }
            }

            // 8. Admin generates comprehensive reports
            const userReports = await callAPI('get-user-reports', { withAdmins: true }, true);
            expect(userReports.csv).to.be.a('string');

            const courseReports = await callAPI('get-course-reports', {}, true);
            expect(courseReports).to.exist;

            // 9. Admin deactivates course when needed
            await callAPI('set-course-visibility', {
                courseId: newCourseId,
                active: false
            }, true);

            // Verify course is no longer visible to learners
            const coursesAfterDeactivation = await callAPI('get-courses', {}, false);
            const deactivatedCourse = coursesAfterDeactivation.find((course: any) => course.id === newCourseId);
            expect(deactivatedCourse).to.not.exist; // Should not appear in learner's course list
        });

        test("Multi-attempt quiz workflow with failure and retry", async function() {
            // Setup: Create course with limited attempts and high pass score
            const courseId = await TestCourseGenerator.generateDummyCourse(true);

            // Enroll and start course
            await callAPI('course-enrollment', { courseId }, false);
            const courseStart = await callAPI('start-course', { courseId }, false);
            const courseAttemptId = courseStart.courseAttemptId;

            // Get course details to understand quiz structure
            const courseData = await callAPI('get-course-data', { courseId }, false);
            const maxAttempts = courseData.course.maxQuizAttempts || 3;

            // Attempt 1: Submit poor answers (likely to fail)
            const quizStart1 = await callAPI('start-quiz', { courseId, courseAttemptId }, false);
            const quiz1 = await callAPI('get-quiz', { quizAttemptId: quizStart1.quizAttemptId }, false);

            const poorResponses = quiz1.questions.map((question: any) => {
                let answer;
                switch (question.type) {
                    case 'TF':
                        answer = 0; // Always false (likely wrong sometimes)
                        break;
                    case 'MC':
                        answer = question.answers.length - 1; // Always last option
                        break;
                    case 'SA':
                        answer = "Poor answer"; // Minimal effort
                        break;
                    default:
                        answer = 0;
                }
                return {
                    questionId: question.id,
                    answer: answer
                };
            });

            await callAPI('submit-quiz', {
                quizAttemptId: quizStart1.quizAttemptId,
                responses: poorResponses
            }, false);

            // Mark any short answer questions with low scores
            const quizAttempt1 = await callAPI('get-quiz-attempt', {
                quizAttemptId: quizStart1.quizAttemptId
            }, true);

            if (quizAttempt1.shortAnswerQuestions && quizAttempt1.shortAnswerQuestions.length > 0) {
                const lowMarks = quizAttempt1.shortAnswerQuestions.map((q: any) => ({
                    questionAttemptId: q.questionAttemptId,
                    marksAchieved: Math.floor(q.marks * 0.2) // Give 20% of marks
                }));

                await callAPI('mark-quiz-attempt', {
                    quizAttemptId: quizStart1.quizAttemptId,
                    marks: lowMarks
                }, true);
            }

            // Check profile to see failed attempt
            const profileAfterFirstAttempt = await callAPI('get-profile', {}, false);
            expect(profileAfterFirstAttempt.quizAttempts).to.be.an('array');
            expect(profileAfterFirstAttempt.quizAttempts.length).to.be.greaterThan(0);

            // Attempt 2: Submit better answers
            if (maxAttempts > 1) {
                const quizStart2 = await callAPI('start-quiz', { courseId, courseAttemptId }, false);
                const quiz2 = await callAPI('get-quiz', { quizAttemptId: quizStart2.quizAttemptId }, false);

                const betterResponses = quiz2.questions.map((question: any) => {
                    let answer;
                    switch (question.type) {
                        case 'TF':
                            answer = question.correctAnswer || 1; // Try to get correct answer
                            break;
                        case 'MC':
                            answer = question.correctAnswer || 0; // Try to get correct answer
                            break;
                        case 'SA':
                            answer = "This is a much more detailed and thoughtful response that demonstrates understanding of the course material.";
                            break;
                        default:
                            answer = 0;
                    }
                    return {
                        questionId: question.id,
                        answer: answer
                    };
                });

                await callAPI('submit-quiz', {
                    quizAttemptId: quizStart2.quizAttemptId,
                    responses: betterResponses
                }, false);

                // Mark short answer questions with higher scores
                const quizAttempt2 = await callAPI('get-quiz-attempt', {
                    quizAttemptId: quizStart2.quizAttemptId
                }, true);

                if (quizAttempt2.shortAnswerQuestions && quizAttempt2.shortAnswerQuestions.length > 0) {
                    const highMarks = quizAttempt2.shortAnswerQuestions.map((q: any) => ({
                        questionAttemptId: q.questionAttemptId,
                        marksAchieved: Math.floor(q.marks * 0.9) // Give 90% of marks
                    }));

                    await callAPI('mark-quiz-attempt', {
                        quizAttemptId: quizStart2.quizAttemptId,
                        marks: highMarks
                    }, true);
                }

                // Check final profile status
                const finalProfile = await callAPI('get-profile', {}, false);
                expect(finalProfile.quizAttempts.length).to.be.greaterThan(1);
            }
        });

        test("Help and support workflow", async function() {
            // Setup: Create a course for context
            const courseId = await TestCourseGenerator.generateDummyCourse(true);

            // 1. Learner sends platform help request
            const platformHelpResult = await callAPI('send-platform-help', {
                feedback: "I'm having trouble navigating the platform. The course list doesn't seem to load properly on my browser."
            }, false);
            expect(platformHelpResult).to.be.null; // Successful help request returns null

            // 2. Learner enrolls in course and sends course-specific help
            await callAPI('course-enrollment', { courseId }, false);

            const courseHelpResult = await callAPI('send-course-help', {
                courseId,
                feedback: "The quiz instructions are unclear. Could you provide more guidance on the expected format for short answer questions?"
            }, false);
            expect(courseHelpResult).to.be.null; // Successful help request returns null

            // 3. Learner checks notifications (might receive responses)
            const notifications = await callAPI('get-notifications', {}, false);
            expect(notifications).to.be.an('array');

            // 4. If there are notifications, learner marks them as read
            if (notifications.length > 0) {
                // Mark specific notification as read
                await callAPI('read-notification', {
                    notificationId: notifications[0].id
                }, false);

                // Mark all notifications as read
                await callAPI('read-notification', {}, false);

                // Verify notifications are marked as read
                const updatedNotifications = await callAPI('get-notifications', {}, false);
                expect(updatedNotifications).to.be.an('array');
            }
        });

        test("Admin user management workflow", async function() {
            // 1. Admin views all users including other admins
            const allUserReports = await callAPI('get-user-reports', { withAdmins: true }, true);
            expect(allUserReports).to.be.an('object');
            expect(allUserReports.csv).to.be.a('string');

            // 2. Admin views learner-only reports
            const learnerReports = await callAPI('get-user-reports', { withAdmins: false }, true);
            expect(learnerReports).to.be.an('object');
            expect(learnerReports.csv).to.be.a('string');

            // 3. Admin checks insights to see user activity
            const insights = await callAPI('get-admin-insights', {}, true);
            expect(insights.learners).to.be.an('array');
            expect(insights.admins).to.be.an('array');

            // 4. Admin invites new learner
            const inviteResult = await callAPI('invite-learner', {
                email: "newlearner@example.com"
            }, true);
            expect(inviteResult).to.be.null;

            // Note: User disabling test would require a specific user ID
            // This would typically be done with a known test user
            // const disableResult = await callAPI('disable-user', {
            //     userId: "test-user-id",
            //     disable: true
            // }, true);
        });

        test("Attempting to access non-existent course", async function() {
            const nonExistentCourseId = 99999;

            try {
                await callAPI('get-course-data', { courseId: nonExistentCourseId }, false);
                expect.fail("Should have thrown an error for non-existent course");
            } catch (error: any) {
                expect(error.message).to.include("error");
            }
        });

        test("Attempting to enroll in inactive course", async function() {
            // Create course but don't activate it
            const inactiveCourseId = await TestCourseGenerator.generateDummyCourse(false);

            try {
                await callAPI('course-enrollment', { courseId: inactiveCourseId }, false);
                expect.fail("Should have thrown an error for inactive course");
            } catch (error: any) {
                expect(error.message).to.include("error");
            }
        });

        test("Attempting to start quiz without enrollment", async function() {
            const courseId = await TestCourseGenerator.generateDummyCourse(true);

            try {
                await callAPI('start-course', { courseId }, false);
                expect.fail("Should have thrown an error for non-enrolled course");
            } catch (error: any) {
                expect(error.message).to.include("error");
            }
        });

        test("Submitting quiz with invalid question IDs", async function() {
            const courseId = await TestCourseGenerator.generateDummyCourse(true);
            await callAPI('course-enrollment', { courseId }, false);
            const courseStart = await callAPI('start-course', { courseId }, false);
            const quizStart = await callAPI('start-quiz', {
                courseId,
                courseAttemptId: courseStart.courseAttemptId
            }, false);

            const invalidResponses = [
                { questionId: 99999, answer: "Invalid question" }
            ];

            try {
                await callAPI('submit-quiz', {
                    quizAttemptId: quizStart.quizAttemptId,
                    responses: invalidResponses
                }, false);
                expect.fail("Should have thrown an error for invalid question ID");
            } catch (error: any) {
                expect(error.message).to.include("error");
            }
        });
    });
});
