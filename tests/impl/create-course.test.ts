import { expect } from 'chai';
import { callAPI } from "../helpers/api.ts";
import TestDatabaseHelper from "../helpers/database.ts";
import Constants from "../helpers/constants.ts";

suite("create-course", function() {

    suiteSetup(async function() {
        await TestDatabaseHelper.wipeDatabase();
    });

    teardown(async function() {
        await TestDatabaseHelper.wipeDatabase();
    });

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

            // Create course and verify
            const createCourseResult = await callAPI('create-course', { course: courseData, quizQuestions: questionData }, true);
            console.log(`Courses creation result: ${JSON.stringify(createCourseResult)}`);

            expect(createCourseResult).to.be.a('number');
            expect(Number.isInteger(createCourseResult)).to.be.true;

            await new Promise(resolve => setTimeout(resolve, 30 * 1000));

            // Get the course data
            const getCourseDataResult = await callAPI('get-course-data', { courseId: createCourseResult }, true);
            console.log(`Courses result: ${JSON.stringify(getCourseDataResult)}`);

            expect(getCourseDataResult).to.be.an('object');
            expect(getCourseDataResult).to.have.keys(['id', 'active', 'name', 'description', 'link', 'status', 'minTime', 'quizData', 'courseAttempt', 'quizAttempts']);

            expect(getCourseDataResult).to.have.property('id').equal(createCourseResult);
            expect(getCourseDataResult).to.have.property('active').equal(true);
            expect(getCourseDataResult).to.have.property('name').equal("create-course SANITY #1 name");
            expect(getCourseDataResult).to.have.property('description').equal("create-course SANITY #1 description");
            expect(getCourseDataResult).to.have.property('link').equal("www.create-course.SANITY.#1.link.com");
            expect(getCourseDataResult).to.have.property('status').equal("NOT_ENROLLED");
            expect(getCourseDataResult).to.have.property('minTime').equal(null);
            expect(getCourseDataResult).to.have.property('quizData').deep.equal({ totalMarks: 1, maxAttempts: null, minScore: 1, timeLimit: null, numQuestions: 1 });
            expect(getCourseDataResult).to.have.property('courseAttempt').equal(null);
            expect(getCourseDataResult).to.have.property('quizAttempts').deep.equal({ number: 0, currentId: null });
        });
    });

    suite("Detailed", function() {

        suiteSetup(function() {
            if (Constants.IS_SANITY) {
                this.skip();
            }
        });
    });
});
