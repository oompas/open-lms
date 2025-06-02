import { callAPI } from "../api.ts";
import { expect } from "chai";
import { faker } from '@faker-js/faker';
import {
    CourseData,
    CourseWithStatus,
    GenerateCourseOptions,
    GenerateCourseWithStatusOptions,
    QuestionData
} from "./types.ts";
import { CourseStatus } from "../enum/CourseStatus.ts";

const randInt = (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Enhanced test course generator that can create courses with specific statuses
 */
class TestCourseGenerator {

    /**
     * Adds a randomly generated test course to the database, activates it, and returns the course ID
     */
    public static async generateDummyCourse(active: boolean = true): Promise<number> {
        return this.generateCourse({ active });
    }

    /**
     * Generates a course with optional customization
     */
    public static async generateCourse(options: GenerateCourseOptions = {}): Promise<number> {
        const {
            active = true,
            asAdmin = true,
            courseData = {},
            questionCount = randInt(1, 10)
        } = options;

        // Generate course data with defaults and overrides
        const defaultCourseData: CourseData = {
            name: faker.lorem.words(randInt(2, 8)),
            description: faker.lorem.paragraph().substring(0, 200),
            link: faker.internet.url(),
            minTime: faker.datatype.boolean() ? Math.floor(Math.random() * 240) + 30 : null,
            maxQuizAttempts: faker.datatype.boolean() ? Math.floor(Math.random() * 5) + 1 : null,
            minQuizScore: 0, // Set later (depends on total quiz marks)
            quizTimeLimit: faker.datatype.boolean() ? Math.floor(Math.random() * 7) * 15 + 15 : null,
            preserveQuizQuestionOrder: faker.datatype.boolean()
        };

        const finalCourseData: CourseData = { ...defaultCourseData, ...courseData };

        // Generate quiz questions
        const quizQuestions: QuestionData[] = [];

        for (let i = 0; i < questionCount; i++) {
            const questionType = faker.helpers.arrayElement<"TF" | "MC" | "SA">(["TF", "MC", "SA"]);
            const marks = randInt(1, 10);
            const questionText = faker.lorem.sentence();

            switch (questionType) {
                case "TF":
                    quizQuestions.push({
                        type: "TF",
                        question: questionText,
                        marks: marks,
                        correctAnswer: faker.datatype.boolean() ? 1 : 0,
                    });
                    break;
                case "MC":
                    const numberOfAnswers = faker.number.int({ min: 2, max: 5 });
                    const answers: string[] = Array.from({ length: numberOfAnswers }, () => faker.lorem.word());
                    const correctAnswerIndex = faker.number.int({ min: 0, max: numberOfAnswers - 1 });
                    quizQuestions.push({
                        type: "MC",
                        question: questionText,
                        marks: marks,
                        correctAnswer: correctAnswerIndex,
                        answers: answers,
                    });
                    break;
                case "SA":
                    quizQuestions.push({
                        type: "SA",
                        question: questionText,
                        marks: marks,
                    });
                    break;
            }
        }

        const totalMarks = quizQuestions.reduce((sum, question) => sum + question.marks, 0);
        finalCourseData.minQuizScore = Math.floor(Math.random() * totalMarks) + 1; // Random score between 1 and total marks

        // Create and verify course
        const courseId = await callAPI('create-course', { course: finalCourseData, quizQuestions: quizQuestions }, asAdmin);

        expect(courseId).to.be.a('number');
        expect(Number.isInteger(courseId)).to.be.true;

        if (active) {
            const setCourseActive = await callAPI('set-course-visibility', { courseId: courseId, active: true }, asAdmin);
            expect(setCourseActive).to.be.null;
        }

        return courseId;
    }

    /**
     * Generates a specified number of dummy courses
     *
     * @param count Number of courses to generate
     * @return List of course IDs generated
     */
    public static async generateDummyCourses(count: number): Promise<number[]> {
        const courseIds: number[] = [];
        for (let i = 0; i < count; ++i) {
            const courseId = await TestCourseGenerator.generateDummyCourse();
            courseIds.push(courseId);
        }
        return courseIds;
    }

    /**
     * Generates a course and sets it to a specific status for a user
     */
    public static async generateCourseWithStatus(options: GenerateCourseWithStatusOptions): Promise<CourseWithStatus> {
        const {
            targetStatus,
            asAdmin = false,
            submitCorrectAnswers = true,
            ...courseOptions
        } = options;

        // Create the course
        const courseId = await this.generateCourse({ ...courseOptions, asAdmin: true });

        // Progress the course to the target status
        const result = await this.setCourseStatus(courseId, targetStatus, asAdmin, submitCorrectAnswers);

        return {
            courseId,
            status: targetStatus,
            quizAttemptId: result.quizAttemptId
        };
    }

    /**
     * Sets a course to a specific status for the current user
     */
    public static async setCourseStatus(
        courseId: number,
        targetStatus: CourseStatus,
        asAdmin: boolean = false,
        submitCorrectAnswers: boolean = true
    ): Promise<{ quizAttemptId?: number }> {
        let quizAttemptId: number | undefined;

        switch (targetStatus) {
            case CourseStatus.NOT_ENROLLED:
                // Do nothing - course is already not enrolled by default
                break;

            case CourseStatus.ENROLLED:
                // Enroll in the course
                await callAPI('course-enrollment', { courseId }, asAdmin);
                break;

            case CourseStatus.IN_PROGRESS:
                // Enroll and start the course
                await callAPI('course-enrollment', { courseId }, asAdmin);
                await callAPI('start-course', { courseId }, asAdmin);
                break;

            case CourseStatus.AWAITING_MARKING:
                // Enroll, start course, start quiz, and submit with short answers
                await callAPI('course-enrollment', { courseId }, asAdmin);
                await callAPI('start-course', { courseId }, asAdmin);

                // Get courseAttemptId from get-course-data
                const courseData = await callAPI('get-course-data', { courseId, adminView: false }, asAdmin);
                const courseAttemptId = courseData.courseAttempt?.currentAttemptId;

                const quizAttempt = await callAPI('start-quiz', { courseId, courseAttemptId }, asAdmin);
                quizAttemptId = quizAttempt.id;

                // Submit quiz with empty answers to trigger manual marking
                await callAPI('submit-quiz', {
                    quizAttemptId: quizAttemptId,
                    responses: []
                }, asAdmin);
                break;

            case CourseStatus.COMPLETED:
                // Enroll, start course, start quiz, submit with correct answers, and mark as passed
                await callAPI('course-enrollment', { courseId }, asAdmin);
                await callAPI('start-course', { courseId }, asAdmin);

                // Get courseAttemptId from get-course-data
                const courseDataCompleted = await callAPI('get-course-data', { courseId, adminView: false }, asAdmin);
                const courseAttemptIdCompleted = courseDataCompleted.courseAttempt?.currentAttemptId;

                const completedQuizAttempt = await callAPI('start-quiz', { courseId, courseAttemptId: courseAttemptIdCompleted }, asAdmin);
                quizAttemptId = completedQuizAttempt.id;

                if (submitCorrectAnswers) {
                    // Get quiz questions to provide correct answers
                    const quiz = await callAPI('get-quiz', { quizAttemptId: quizAttemptId }, asAdmin);
                    const correctAnswers = quiz.questions.map((question: any) => {
                        if (question.type === 'TF' || question.type === 'MC') {
                            return question.correctAnswer;
                        }
                        return "Correct answer"; // For short answer questions
                    });

                    await callAPI('submit-quiz', {
                        quizAttemptId: quizAttemptId,
                        responses: correctAnswers
                    }, asAdmin);
                } else {
                    await callAPI('submit-quiz', {
                        quizAttemptId: quizAttemptId,
                        responses: []
                    }, asAdmin);
                }

                // Mark the quiz attempt as passed (admin action)
                await callAPI('mark-quiz-attempt', {
                    quizAttemptId: quizAttemptId,
                    passed: true
                }, true);
                break;

            case CourseStatus.FAILED:
                // Enroll, start course, start quiz, submit with wrong answers, and mark as failed
                await callAPI('course-enrollment', { courseId }, asAdmin);
                await callAPI('start-course', { courseId }, asAdmin);

                // Get courseAttemptId from get-course-data
                const courseDataFailed = await callAPI('get-course-data', { courseId, adminView: false }, asAdmin);
                const courseAttemptIdFailed = courseDataFailed.courseAttempt?.currentAttemptId;

                const failedQuizAttempt = await callAPI('start-quiz', { courseId, courseAttemptId: courseAttemptIdFailed }, asAdmin);
                quizAttemptId = failedQuizAttempt.id;

                // Submit with wrong answers
                const quiz = await callAPI('get-quiz', { quizAttemptId: quizAttemptId }, asAdmin);
                const wrongAnswers = quiz.questions.map((question: any) => {
                    if (question.type === 'TF') {
                        return question.correctAnswer === 1 ? 0 : 1; // Opposite of correct
                    } else if (question.type === 'MC') {
                        return (question.correctAnswer + 1) % question.answers.length; // Choose a wrong answer
                    }
                    return "Wrong answer"; // For short answer questions
                });

                await callAPI('submit-quiz', {
                    quizAttemptId: quizAttemptId,
                    responses: wrongAnswers
                }, asAdmin);

                // Mark the quiz attempt as failed (admin action)
                await callAPI('mark-quiz-attempt', {
                    quizAttemptId: quizAttemptId,
                    passed: false
                }, true);
                break;

            default:
                throw new Error(`Unsupported course status: ${targetStatus}`);
        }

        return { quizAttemptId };
    }

    /**
     * Generates multiple courses with different statuses for testing
     */
    public static async generateCoursesWithVariousStatuses(
        count: number = 6,
        asAdmin: boolean = false
    ): Promise<CourseWithStatus[]> {
        const statuses = Object.values(CourseStatus);
        const courses: CourseWithStatus[] = [];

        for (let i = 0; i < count; i++) {
            const status = statuses[i % statuses.length];
            const course = await this.generateCourseWithStatus({
                targetStatus: status,
                asAdmin
            });
            courses.push(course);
        }

        return courses;
    }

    /**
     * Enrolls a user in an existing course and optionally progresses to a specific status
     */
    public static async enrollUserInCourse(
        courseId: number,
        targetStatus: CourseStatus = CourseStatus.ENROLLED,
        asAdmin: boolean = false,
        submitCorrectAnswers: boolean = true
    ): Promise<{ quizAttemptId?: number }> {
        return this.setCourseStatus(courseId, targetStatus, asAdmin, submitCorrectAnswers);
    }

    /**
     * Creates a course with specific quiz configuration for testing
     */
    public static async generateCourseWithQuizConfig(options: {
        questionTypes?: Array<"TF" | "MC" | "SA">;
        questionCount?: number;
        timeLimit?: number | null;
        maxAttempts?: number | null;
        minScore?: number;
        preserveOrder?: boolean;
        asAdmin?: boolean;
    } = {}): Promise<number> {
        const {
            questionTypes = ["TF", "MC", "SA"],
            questionCount = 5,
            timeLimit = null,
            maxAttempts = null,
            minScore = 50,
            preserveOrder = false,
            asAdmin = true
        } = options;

        const courseData: Partial<CourseData> = {
            quizTimeLimit: timeLimit,
            maxQuizAttempts: maxAttempts,
            minQuizScore: minScore,
            preserveQuizQuestionOrder: preserveOrder
        };

        // Generate specific question types
        const quizQuestions: QuestionData[] = [];
        for (let i = 0; i < questionCount; i++) {
            const questionType = questionTypes[i % questionTypes.length];
            const marks = randInt(1, 10);
            const questionText = faker.lorem.sentence();

            switch (questionType) {
                case "TF":
                    quizQuestions.push({
                        type: "TF",
                        question: questionText,
                        marks: marks,
                        correctAnswer: faker.datatype.boolean() ? 1 : 0,
                    });
                    break;
                case "MC":
                    const numberOfAnswers = faker.number.int({ min: 2, max: 5 });
                    const answers: string[] = Array.from({ length: numberOfAnswers }, () => faker.lorem.word());
                    const correctAnswerIndex = faker.number.int({ min: 0, max: numberOfAnswers - 1 });
                    quizQuestions.push({
                        type: "MC",
                        question: questionText,
                        marks: marks,
                        correctAnswer: correctAnswerIndex,
                        answers: answers,
                    });
                    break;
                case "SA":
                    quizQuestions.push({
                        type: "SA",
                        question: questionText,
                        marks: marks,
                    });
                    break;
            }
        }

        // Update min score based on total marks if not explicitly set
        const totalMarks = quizQuestions.reduce((sum, question) => sum + question.marks, 0);
        if (minScore > totalMarks) {
            courseData.minQuizScore = Math.floor(totalMarks * 0.7); // 70% of total marks
        }

        // Create course
        const courseId = await callAPI('create-course', {
            course: {
                name: faker.lorem.words(randInt(2, 8)),
                description: faker.lorem.paragraph().substring(0, 200),
                link: faker.internet.url(),
                minTime: null,
                ...courseData
            },
            quizQuestions
        }, asAdmin);

        expect(courseId).to.be.a('number');
        expect(Number.isInteger(courseId)).to.be.true;

        // Activate course
        await callAPI('set-course-visibility', { courseId: courseId, active: true }, asAdmin);

        return courseId;
    }

    /**
     * Utility method to verify course status for a user
     */
    public static async verifyCourseStatus(
        courseId: number,
        expectedStatus: CourseStatus,
        asAdmin: boolean = false
    ): Promise<void> {
        const courses = await callAPI('get-courses', {}, asAdmin);
        const course = courses.find((c: any) => c.id === courseId);
        expect(course).to.exist;
        expect(course.status).to.equal(expectedStatus);
    }
}

export default TestCourseGenerator;
