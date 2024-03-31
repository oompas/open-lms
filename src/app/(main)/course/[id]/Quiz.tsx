"use client";
import Button from "@/components/Button"
import { useRouter } from 'next/navigation'
import { ApiEndpoints, callApi } from "@/config/firebase";

export default function Quiz({
    length,
    maxAttempts,
    numQuestions,
    totalMarks,
    minimumScore,
    quizStarted,
    courseAttemptId,
    quizAttemptId,
    courseId
} : {
    length: string
    maxAttempts: number
    numQuestions: number
    totalMarks: number
    minimumScore: number
    quizStarted: boolean | null
    courseAttemptId: any
    quizAttemptId: any
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
            <div className="flex flex-row items-center">
                <div className="flex flex-col mr-auto text-lg">
                    {length && <div>{length} minute time limit</div>}
                    {maxAttempts && <div>{maxAttempts} attempts allowed</div>}
                    <div>{numQuestions} questions{minimumScore && ` (${minimumScore / totalMarks * 100}% minimum passing grade)`}</div>
                </div>
                {quizStarted !== null &&
                    <Button
                        text={quizStarted ? "Continue quiz" : "Click to start"}
                        onClick={async () => await goToQuiz()}
                    />
                }
            </div>
        </div>
    );
}
