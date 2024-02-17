"use client"

import Button from "@/components/Button"
import { useRouter } from 'next/navigation'

export default function Quiz({
    length,
    attempts,
    id
} : {
    length: string
    attempts: number
    id: number
}) {

    const router = useRouter()

    return (
        <div className="border-4 mb-8 p-6 rounded-2xl">
            <div className="text-2xl mb-2">Quiz</div>
            <div className="flex flex-row items-end">
                <div className="flex flex-col mr-auto text-lg">
                    <div>Quiz Length: {length}</div>
                    <div># of attempts allowed: {attempts}</div>
                </div>
                <Button text="Click to start" onClick={() => router.push("/quiz/" + id)} style="mt-2"/>
            </div>
        </div>
    )
}


