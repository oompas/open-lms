"use client";
import Button from "@/components/Button"
import { useRouter } from 'next/navigation'
import { callApi } from "@/config/firebase";

export default function Quiz({
    length,
    maxAttempts,
    numQuestions,
    minimumScore,
    quizStarted,
    courseAttemptId,
    quizAttemptId,
    courseId
} : {
    length: string
    maxAttempts: number
    numQuestions: number
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
            await callApi("startQuiz", { courseAttemptId: courseAttemptId })
                .then((result) => router.push(`/quiz/${courseId}-${result.data}`))
                .catch((e) => console.log(`Error starting quiz: ${e}`));
        }
    }

    return (
        <div className="border-4 mb-8 p-6 rounded-2xl">
            <div className="text-2xl mb-2">Quiz</div>
            <div className="flex flex-row items-end">
                <div className="flex flex-col mr-auto text-lg">
                    {length && <div>Quiz Length: {length} minutes</div>}
                    {maxAttempts && <div># of attempts allowed: {maxAttempts}</div>}
                    <div>{numQuestions} questions{minimumScore && ` (${minimumScore} required to pass)`}</div>
                </div>
                {quizStarted !== null &&
                    <Button
                        text={quizStarted ? "Continue quiz" : "Click to start"}
                        onClick={async () => await goToQuiz()}
                        style="mt-2"
                    />
                }
            </div>
        </div>
    );
}
