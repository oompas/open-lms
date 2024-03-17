"use client";
import Button from "@/components/Button"
import { useRouter } from 'next/navigation'

export default function Quiz({
    length,
    attempts,
    numQuestions,
    minimumScore,
    id
} : {
    length: string
    attempts: number
    numQuestions: number
    minimumScore: number
    id: number
}) {

    const router = useRouter();

    return (
        <div className="border-4 mb-8 p-6 rounded-2xl">
            <div className="text-2xl mb-2">Quiz</div>
            <div className="flex flex-row items-end">
                <div className="flex flex-col mr-auto text-lg">
                    {length && <div>Quiz Length: {length} minutes</div>}
                    {attempts && <div># of attempts allowed: {attempts}</div>}
                    <div>{numQuestions} questions{minimumScore && ` (${minimumScore} required to pass)`}</div>
                </div>
                <Button text="Click to start" onClick={() => router.push("/quiz/" + id)} style="mt-2"/>
            </div>
        </div>
    );
}
