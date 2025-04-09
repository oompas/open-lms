import { expect } from 'chai';
import { callAPI } from "../helpers/api.ts";
import { sanitySkipDetailed, setupWipeDb } from "../helpers/mocha.ts";
import Constants from "../helpers/constants.ts";

suite("create-course", function() {

    setupWipeDb();

    async function createCourseAndVerify(testName: string, courseData: any, questionData: any) {

        // First, create the course (this returns the course ID)
        const createCourseResult = await callAPI('create-course', { course: courseData, quizQuestions: questionData }, true);
        expect(createCourseResult).to.be.a('number');
        expect(Number.isInteger(createCourseResult)).to.be.true;

        // Next, activate the course (it can;t be queried otherwise)
        const activeCourseResult = await callAPI('set-course-visibility', { courseId: createCourseResult, active: true }, true);
        expect(activeCourseResult).to.be.null;

        // Lastly, get the course's data and validate it
        const getCourseDataResult = await callAPI('get-course-data', { courseId: createCourseResult, adminView: false }, true);
        expect(getCourseDataResult).to.be.an('object');
        expect(getCourseDataResult).to.have.keys(['id', 'active', 'name', 'description', 'link', 'status', 'minTime', 'quizData', 'courseAttempt', 'quizAttempts']);

        expect(getCourseDataResult).to.have.property('id').equal(createCourseResult);
        expect(getCourseDataResult).to.have.property('active').equal(true);
        expect(getCourseDataResult).to.have.property('name').equal(courseData.name);
        expect(getCourseDataResult).to.have.property('description').equal(courseData.description);
        expect(getCourseDataResult).to.have.property('link').equal(courseData.link);
        expect(getCourseDataResult).to.have.property('status').equal(Constants.courseStatus.NOT_ENROLLED);
        expect(getCourseDataResult).to.have.property('minTime').equal(courseData.minTime);

        const totalMarks = questionData.reduce((sum: number, q: any) => sum + q.marks, 0);
        expect(getCourseDataResult).to.have.property('quizData').deep.equal({
            totalMarks: totalMarks,
            maxAttempts: courseData.maxQuizAttempts ?? null,
            minScore: courseData.minQuizScore,
            timeLimit: courseData.quizTimeLimit ?? null,
            numQuestions: questionData.length,
        });

        expect(getCourseDataResult).to.have.property('courseAttempt').to.be.null;
        expect(getCourseDataResult).to.have.property('quizAttempts').deep.equal({ number: 0, currentId: null });

        return getCourseDataResult;
    }

    suite("Sanity", function() {
        test("Minimal data", async function() {
            const courseData = {
                name: "create-course SANITY #1 name",
                description: "create-course SANITY #1 description",
                link: "www.create-course.SANITY.#1.link.com",
                minTime: null,
                maxQuizAttempts: null,
                minQuizScore: 1,
                quizTimeLimit: null,
                preserveQuizQuestionOrder: true
            };
            const questionData = [
                {
                    type: "TF",
                    question: "Is the sky blue?",
                    marks: 1,
                    correctAnswer: 0
                }
            ];

            await createCourseAndVerify(this.test!.title, courseData, questionData);
        });

        test("Course with only name and description", async function() {
            const courseData = {
                name: "Sanity Test Course Name Only",
                description: "Sanity test course description.",
                link: "www.sanity-test-course.com",
                minTime: null,
                maxQuizAttempts: null,
                minQuizScore: 50,
                quizTimeLimit: null,
                preserveQuizQuestionOrder: false
            };
            const questionData: any[] = []; // No questions

            await createCourseAndVerify(this.test!.title, courseData, questionData);
        });

        test("Course with multiple choice question", async function() {
            const courseData = {
                name: "Sanity MC Question Course",
                description: "Course with a multiple choice question.",
                link: "www.sanity-mc-course.com",
                minTime: null,
                maxQuizAttempts: 2,
                minQuizScore: 80,
                quizTimeLimit: 60,
                preserveQuizQuestionOrder: true
            };
            const questionData = [
                {
                    type: "MC",
                    question: "What is the capital of France?",
                    marks: 5,
                    correctAnswer: 0,
                    answers: ["Paris", "Berlin", "London", "Madrid"]
                }
            ];

            await createCourseAndVerify(this.test!.title, courseData, questionData);
        });
    });

    suite("Detailed", function() {

        sanitySkipDetailed();

        test("Course with minimum allowed data", async function() {
            const courseData = {
                name: "min length name",
                description: "min length description",
                link: "m",
                minTime: null,
                maxQuizAttempts: null,
                minQuizScore: 1,
                quizTimeLimit: null,
                preserveQuizQuestionOrder: true
            };
            const questionData = [
                {
                    type: "TF",
                    question: "q",
                    marks: 1,
                    correctAnswer: 0
                }
            ];

            await createCourseAndVerify(this.test!.title, courseData, questionData);
        });

        test("Course with maximum allowed data", async function() {
            const longString200 = "a".repeat(200);
            const longString1000 = "b".repeat(1000);

            const courseData = {
                name: longString200,
                description: longString200,
                link: longString1000,
                minTime: 3600,
                maxQuizAttempts: 10,
                minQuizScore: 100,
                quizTimeLimit: 7200,
                preserveQuizQuestionOrder: false
            };
            const questionData = [
                {
                    type: "MC",
                    question: longString200,
                    marks: 20,
                    correctAnswer: 3,
                    answers: [longString200, longString200, longString200, longString200]
                },
                {
                    type: "TF",
                    question: longString200,
                    marks: 20,
                    correctAnswer: 1
                },
                {
                    type: "SA",
                    question: longString200,
                    marks: 20
                }
            ];

            await createCourseAndVerify(this.test!.title, courseData, questionData);
        });

        test("Course with short answer question", async function() {
            const courseData = {
                name: "Short Answer Course",
                description: "Course with a short answer question.",
                link: "www.sa-course.com",
                minTime: 30,
                maxQuizAttempts: 5,
                minQuizScore: 60,
                quizTimeLimit: 120,
                preserveQuizQuestionOrder: true
            };
            const questionData = [
                {
                    type: "SA",
                    question: "What is your name?",
                    marks: 10
                }
            ];

            await createCourseAndVerify(this.test!.title, courseData, questionData);
        });

        test("Course with different quiz settings", async function() {
            const courseData = {
                name: "Quiz Settings Test",
                description: "Testing different quiz settings.",
                link: "www.quiz-settings.com",
                minTime: null,
                maxQuizAttempts: 1,
                minQuizScore: 90,
                quizTimeLimit: 300,
                preserveQuizQuestionOrder: false
            };
            const questionData = [
                {
                    type: "TF",
                    question: "Water is wet.",
                    marks: 5,
                    correctAnswer: 1
                }
            ];

            await createCourseAndVerify(this.test!.title, courseData, questionData);
        });

        test("Course with minTime and quizTimeLimit", async function() {
            const courseData = {
                name: "Timed Course Test",
                description: "Course with minTime and quizTimeLimit set.",
                link: "www.timed-course.com",
                minTime: 120,
                maxQuizAttempts: null,
                minQuizScore: 75,
                quizTimeLimit: 600,
                preserveQuizQuestionOrder: true
            };
            const questionData = [
                {
                    type: "TF",
                    question: "Time is relative.",
                    marks: 3,
                    correctAnswer: 1
                }
            ];

            await createCourseAndVerify(this.test!.title, courseData, questionData);
        });
    });
});
