import { callAPI } from "../api.ts";
import { expect } from "chai";
import { faker } from '@faker-js/faker';

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

const randInt = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generates random int in the given range (both inclusive)
class TestCourseGenerator {

    /**
     * Adds a randomly generated test course to the database
     */
    public static async generateDummyCourse() {

        // Generate course data
        const courseData: CourseData = {
            name: faker.lorem.words(randInt(2, 8)),
            description: faker.lorem.paragraph(),
            link: faker.internet.url(),
            minTime: faker.datatype.boolean() ? Math.floor(Math.random() * 240) + 30 : null,

            maxQuizAttempts: faker.datatype.boolean() ? Math.floor(Math.random() * 5) + 1 : null,
            minQuizScore: 0, // Set later (depends on total quiz marks)
            quizTimeLimit: faker.datatype.boolean() ? Math.floor(Math.random() * 7) * 15 + 15 : null,
            preserveQuizQuestionOrder: faker.datatype.boolean()
        };

        // Generate quiz questions
        const numberOfQuestions = randInt(1, 10);
        const quizQuestions: QuestionData[] = [];

        for (let i = 0; i < numberOfQuestions; i++) {
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
                    const numberOfAnswers = faker.datatype.number({ min: 2, max: 5 });
                    const answers: string[] = Array.from({ length: numberOfAnswers }, () => faker.lorem.word());
                    const correctAnswerIndex = faker.datatype.number({ min: 0, max: numberOfAnswers - 1 });
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
        courseData.minQuizScore = Math.floor(Math.random() * totalMarks) + 1; // Random score between 1 and total marks

        // Create and verify course
        const createCourseResult = await callAPI('create-course', { course: courseData, quizQuestions: quizQuestions }, true);

        expect(createCourseResult).to.be.a('number');
        expect(Number.isInteger(createCourseResult)).to.be.true;
    }

    /**
     * Generates a specified number of dummy courses
     *
     * @param count Number of courses to generate
     */
    public static async generateDummyCourses(count: number) {
        for (let i = 0; i < count; i++) {
            await TestCourseGenerator.generateDummyCourse();
        }
    }
}

export default TestCourseGenerator;
