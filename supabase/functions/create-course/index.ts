import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import EdgeFunctionRequest, { RunParams } from "../_shared/EdgeFunctionRequest.ts";
import createCourse from "./createCourse.ts";
import { bool, enumValues, number, object, string, union } from "../_shared/validation.ts";

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
            quizQuestions: object({
                type: enumValues(['mc', 'tf', 'sa']),
                question: string()
            })
        },
        endpointFunction: createCourse,
        adminOnly: true
    };

    return await EdgeFunctionRequest.run(parameters);
});
