import { callAPI } from "../api.ts";
import { expect } from "chai";

interface CourseData {
    name: string;
    description: string;
    link: string;
    minTime: number | null;
    maxQuizAttempts: number | null;
    minQuizScore: number;
    quizTimeLimit: number | null;
    preserveQuizQuestionOrder: boolean;
}

interface QuestionData {
    type: "TF" | "MC" | "SA";
    question: string;
    marks: number;
    correctAnswer?: number; // For TF and MC
    answers?: string[];    // For MC
}

class TestCourseGenerator {

    private static generatedIds: Set<number> = new Set<number>();

    // Generated unique dummy course id (note: This is not for the database primary key)
    private static generateDummyId(): number {
        let dummyId: number;

        while (true) {
            dummyId = Math.floor(Math.random() * 100_000) + 1;
            if (!TestCourseGenerator.generatedIds.has(dummyId)) {
                TestCourseGenerator.generatedIds.add(dummyId);
                return dummyId;
            }
        }
    }

    /**
     * Adds a randomly generated test course to the database
     */
    public static async generateDummyCourse() {
        const dummyId = TestCourseGenerator.generateDummyId();

        const courseName = `Dummy Course ${dummyId}`;
        const courseDescription = `This is a dummy course number ${dummyId} for testing purposes.`;
        const courseLink = `www.dummycourse${dummyId}.com`;
        const minTime = dummyId % 3 === 0 ? 60 : null; // Some courses with min time
        const maxQuizAttempts = dummyId % 2 === 0 ? 3 : null; // Some with limited attempts
        const quizTimeLimit = dummyId % 4 === 0 ? 300 : null; // Some with time limit
        const preserveQuizQuestionOrder = dummyId % 2 === 0;

        const courseData: CourseData = {
            name: courseName,
            description: courseDescription,
            link: courseLink,
            minTime: minTime,
            maxQuizAttempts: maxQuizAttempts,
            minQuizScore: 0, // Set later (depends on quiz total marks)
            quizTimeLimit: quizTimeLimit,
            preserveQuizQuestionOrder: preserveQuizQuestionOrder,
        };

        const quizQuestions: QuestionData[] = [
            {
                type: "TF",
                question: `Question 1 for ${courseName}: True or false?`,
                marks: Math.floor(Math.random() * 2) + 1,
                correctAnswer: dummyId % 2, // Alternate true/false
            },
            {
                type: "MC",
                question: `Question 2 for ${courseName}: Choose the correct option.`,
                marks: Math.floor(Math.random() * 6) + 1,
                correctAnswer: 1,
                answers: ["Option A", "Option B", "Option C", "Option D"],
            },
            {
                type: "SA",
                question: `Question 3 for ${courseName}: Short answer question.`,
                marks: Math.floor(Math.random() * 10) + 1,
            },
        ];

        const totalMarks = quizQuestions.reduce((sum, question) => sum + question.marks, 0);
        courseData.minQuizScore = Math.floor(Math.random() * totalMarks) + 1; // Random score between 1 and total marks

        // Create and verify course
        const createCourseResult = await callAPI('create-course', { course: courseData, quizQuestions: quizQuestions }, true);

        expect(createCourseResult).to.be.a('number');
        expect(Number.isInteger(createCourseResult)).to.be.true;
    }

    public static async generateDummyCourses(count: number) {
        TestCourseGenerator.generatedIds.clear();
        for (let i = 0; i < count; i++) {
            await this.generateDummyCourse();
        }
        TestCourseGenerator.generatedIds.clear();
    }
}

export default TestCourseGenerator;
