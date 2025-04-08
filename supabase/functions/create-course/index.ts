import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import EdgeFunctionRequest, { RunParams } from "../_shared/EdgeFunctionRequest.ts";
import createCourse from "./createCourse.ts";
import { array, bool, enumNumbers, literal, number, object, string, union } from "../_shared/validation.ts";
import { QuestionType } from "../_shared/Enum/QuestionType.ts";

Deno.serve(async (req: Request) => {
    const parameters: RunParams = {
        metaUrl: import.meta.url,
        req: req,
        schemaRecord: {
            course: object({
                name: string({ min: 5, max: 200 }),
                description: string({ min: 5, max: 200 }),
                link: string({ min: 1, max: 1000 }),
                minTime: number({ nullable: true }),

                maxQuizAttempts: number({ nullable: true }),
                minQuizScore: number().min(1),
                quizTimeLimit: number({ nullable: true }),
                preserveQuizQuestionOrder: bool()
            }),
            quizQuestions: array(union([
                object({
                    type: literal(QuestionType.MULTIPLE_CHOICE),
                    question: string({ min: 1, max: 200 }),
                    marks: number().min(1).max(20),
                    correctAnswer: number().min(0).max(4),
                    answers: array(string({ min: 1, max: 200 }))
                }),
                object({
                    type: literal(QuestionType.TRUE_FALSE),
                    question: string({ min: 1, max: 200 }),
                    marks: number().min(1).max(20),
                    correctAnswer: enumNumbers([0, 1])
                }),
                object({
                    type: literal(QuestionType.SHORT_ANSWER),
                    question: string({ min: 1, max: 200 }),
                    marks: number().min(1).max(20)
                }),
            ]))
        },
        endpointFunction: createCourse,
        adminOnly: true
    };

    return await EdgeFunctionRequest.run(parameters);
});
