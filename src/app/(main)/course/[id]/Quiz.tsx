"use client";
import Button from "@/components/Button"
import { useRouter } from 'next/navigation'
import { ApiEndpoints, callApi } from "@/config/firebase";

export default function Quiz({
    length,
    numAttempts,
    maxAttempts,
    numQuestions,
    minimumScore,
    totalMarks,
    quizStarted,
    courseAttemptId,
    quizAttemptId,
    courseStatus,
    courseId
} : {
    length: string
    numAttempts: number
    maxAttempts: number
    numQuestions: number
    minimumScore: number
    totalMarks: number
    quizStarted: boolean | null
    courseAttemptId: any
    quizAttemptId: any
    courseStatus: number
    courseId: string
}) {

    const router = useRouter();

    const goToQuiz = async () => {
        if (quizStarted) {
            router.push(`/quiz/${courseId}-${quizAttemptId}`);
        } else {
            await callApi(ApiEndpoints.StartQuiz, { courseAttemptId: courseAttemptId })
                .then((result) => router.push(`/quiz/${courseId}-${result.data}`))
                .catch((e) => console.log(`Error starting quiz: ${e}`));
        }
    }

    return (
        <div className="border-4 mb-8 p-6 rounded-2xl">
            <div className="flex flex-col items-center">
                <div className="flex flex-row mr-auto text-lg w-full justify-between space-x-4">
                    {length && 
                        <div className="flex flex-col border p-2 rounded-lg items-center justify-center text-center">
                            <div className="w-max text-md">Time Limit</div>
                            <div className="text-3xl">{length}</div>
                            <div className="text-sm">minute{length==="1" ? "" : "s"}</div>
                        </div>
                    }
                    {maxAttempts && 
                        <div className="flex flex-col border p-2 rounded-lg items-center text-center justify-center">
                            <div className="w-max text-md">Attempts</div>
                            <div className="text-3xl">{numAttempts}/{maxAttempts}</div>
                            <div className="text-sm opacity-0">marks</div>
                        </div>
                    }
                    <div className="flex flex-col border p-2 rounded-lg items-center text-center justify-center">
                        <div className="w-max text-md">Questions</div>
                        <div className="text-3xl">{numQuestions}</div>
                        <div className="text-sm opacity-0">marks</div>
                    </div>
                    <div className="flex flex-col border p-2 rounded-lg items-center text-center justify-center">
                        <div className="w-max text-md">Pass Score</div>
                        <div className="text-3xl">{minimumScore}/{totalMarks}</div>
                        <div className="text-sm">marks</div>
                    </div>
                </div>
                {quizStarted !== null && courseStatus !== 5 &&
                    <Button
                        text={quizStarted ? "Continue quiz" : "Click to start"}
                        onClick={async () => await goToQuiz()}
                        style="mt-6"
                    />
                }
            </div>
        </div>
    );
}
