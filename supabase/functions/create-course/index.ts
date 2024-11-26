import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import EdgeFunctionRequest, { RunParams } from "../_shared/EdgeFunctionRequest.ts";
import createCourse from "./createCourse.ts";
import { array, bool, enumValues, literal, number, object, string, union } from "../_shared/validation.ts";

Deno.serve(async (req: Request) => {
    const parameters: RunParams = {
        metaUrl: import.meta.url,
        req: req,
        schemaRecord: {
            course: object({
                name: string().min(5).max(200),
                description: string().min(5).max(200),
                link: string().min(1).max(1000),

                minTime: number(true),

                maxQuizAttempts: number(true),
                minQuizScore: number().min(1),
                preserveQuizQuestionOrder: bool(),
                quizTimeLimit: number(true)
            }),
            quizQuestions: array(union([
                object({
                    type: literal('mc'),
                    question: string().min(1),
                    marks: number().min(1).max(20),
                    correctAnswer: number().min(0).max(4),
                    answers: array(string().min(1))
                }),
                object({
                    type: literal('tf'),
                    question: string().min(1),
                    marks: number().min(1).max(20),
                    correctAnswer: enumValues([0, 1])
                }),
                object({
                    type: literal('sa'),
                    question: string().min(1),
                    marks: number().min(1).max(20)
                }),
            ]))
        },
        endpointFunction: createCourse,
        adminOnly: true
    };

    return await EdgeFunctionRequest.run(parameters);
});
