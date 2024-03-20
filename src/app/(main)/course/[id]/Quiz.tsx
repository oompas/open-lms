"use client";
import Button from "@/components/Button"
import { useRouter } from 'next/navigation'
import { callApi } from "@/config/firebase";

export default function Quiz({
    length,
    maxAttempts,
    numQuestions,
    minimumScore,
    inProgress,
    id
} : {
    length: string
    maxAttempts: number
    numQuestions: number
    minimumScore: number
    inProgress: boolean | null
    id: number
}) {

    const router = useRouter();

    const startQuiz = async () => {
        await callApi("startQuiz")({ courseId: id })
            .then(() => router.push(`/quiz/${id}`))
            .catch((e) => console.log(`Error starting quiz: ${e}`));
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
                {inProgress !== null && <Button text={inProgress ? "Continue quiz" : "Click to start"} onClick={async () => await startQuiz()} style="mt-2"/>}
            </div>
        </div>
    );
}
