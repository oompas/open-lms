import { expect } from 'chai';
import { callAPI } from "../helpers/api.ts";
import { sanitySkipDetailed, setupWipeDb } from "../helpers/mocha.ts";

suite("create-course", function() {
    let testStartTime: number;

    setupWipeDb();

    function startTimer() {
        testStartTime = performance.now();
    }

    function logTime(testName: string) {
        const endTime = performance.now();
        const duration = endTime - testStartTime;
        console.log(`Test "${testName}" took ${duration.toFixed(2)} ms`);
    }

    async function createCourseAndVerify(testName: string, courseData: any, questionData: any) {
        startTimer();
        const createCourseResult = await callAPI('create-course', { course: courseData, quizQuestions: questionData }, true);
        logTime(`${testName} - Create Course API`);

        expect(createCourseResult).to.be.a('number');
        expect(Number.isInteger(createCourseResult)).to.be.true;

        startTimer();
        const activeCourseResult = await callAPI('set-course-visibility', { courseId: createCourseResult, active: true }, true);
        logTime(`${testName} - Set Course Active API`);
        expect(activeCourseResult).to.be.null;

        startTimer();
        const getCourseDataResult = await callAPI('get-course-data', { courseId: createCourseResult }, true);
        logTime(`${testName} - Get Course Data API`);
        expect(getCourseDataResult).to.be.an('object');
        expect(getCourseDataResult).to.have.keys(['id', 'active', 'name', 'description', 'link', 'status', 'minTime', 'quizData', 'courseAttempt', 'quizAttempts']);

        expect(getCourseDataResult).to.have.property('id').equal(createCourseResult);
        expect(getCourseDataResult).to.have.property('active').equal(true);

        return getCourseDataResult;
    }

    function assertCourseData(actualData: any, expectedData: any) {
        expect(actualData).to.have.property('name').equal(expectedData.name);
        expect(actualData).to.have.property('description').equal(expectedData.description);
        expect(actualData).to.have.property('link').equal(expectedData.link);
        expect(actualData).to.have.property('minTime').equal(expectedData.minTime);
    }

    function assertQuizData(actualData: any, expectedCourseData: any, expectedQuestionData: any) {
        const totalMarks = expectedQuestionData.reduce((sum: number, q: any) => sum + q.marks, 0);
        expect(actualData).to.have.property('quizData').deep.equal({
            totalMarks: totalMarks,
            maxAttempts: expectedCourseData.maxQuizAttempts ?? null,
            minScore: expectedCourseData.minQuizScore,
            timeLimit: expectedCourseData.quizTimeLimit ?? null,
            numQuestions: expectedQuestionData.length,
        });
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

            const getCourseDataResult = await createCourseAndVerify(this.test!.title, courseData, questionData);
            assertCourseData(getCourseDataResult, courseData);
            assertQuizData(getCourseDataResult, courseData, questionData);
            expect(getCourseDataResult).to.have.property('quizAttempts').deep.equal({ number: 0, currentId: null });
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

            const getCourseDataResult = await createCourseAndVerify(this.test!.title, courseData, questionData);
            assertCourseData(getCourseDataResult, courseData);
            assertQuizData(getCourseDataResult, courseData, questionData);
            expect(getCourseDataResult).to.have.property('quizAttempts').deep.equal({ number: 0, currentId: null });
            expect(getCourseDataResult).to.have.property('quizData').deep.equal({ totalMarks: 0, maxAttempts: null, minScore: 50, timeLimit: null, numQuestions: 0 });
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

            const getCourseDataResult = await createCourseAndVerify(this.test!.title, courseData, questionData);
            assertCourseData(getCourseDataResult, courseData);
            assertQuizData(getCourseDataResult, courseData, questionData);
            expect(getCourseDataResult).to.have.property('quizAttempts').deep.equal({ number: 0, currentId: null });
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

            const getCourseDataResult = await createCourseAndVerify(this.test!.title, courseData, questionData);
            assertCourseData(getCourseDataResult, courseData);
            assertQuizData(getCourseDataResult, courseData, questionData);
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

            const getCourseDataResult = await createCourseAndVerify(this.test!.title, courseData, questionData);
            assertCourseData(getCourseDataResult, courseData);
            assertQuizData(getCourseDataResult, courseData, questionData);
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

            const getCourseDataResult = await createCourseAndVerify(this.test!.title, courseData, questionData);
            assertCourseData(getCourseDataResult, courseData);
            assertQuizData(getCourseDataResult, courseData, questionData);
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

            const getCourseDataResult = await createCourseAndVerify(this.test!.title, courseData, questionData);
            assertCourseData(getCourseDataResult, courseData);
            assertQuizData(getCourseDataResult, courseData, questionData);
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

            const getCourseDataResult = await createCourseAndVerify(this.test!.title, courseData, questionData);
            assertCourseData(getCourseDataResult, courseData);
            assertQuizData(getCourseDataResult, courseData, questionData);
            expect(getCourseDataResult).to.have.property('quizData').deep.equal({ totalMarks: 3, maxAttempts: null, minScore: 75, timeLimit: 600, numQuestions: 1 });
        });
    });
});
