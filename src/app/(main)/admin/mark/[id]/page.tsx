"use client"
import {useRouter} from "next/navigation";
import QuizAnswer from "@/app/(main)/admin/mark/[id]/QuizAnswer";
import Button from "@/components/Button";

export default function Mark() {

    const router = useRouter()

    const TEMP_QUIZ_ANSWER_DATA = [
        { question: "Example knowledge quiz question 1?", answer: "Quiz answer 3", id: 1 },
        { question: "Example knowledge quiz question 2?", answer: "Quiz answer 3", id: 2 },
        { question: "Example knowledge quiz question 3?", answer: "Quiz answer 3", id: 3 },
        { question: "Example knowledge quiz question 4?", answer: "Quiz answer 3", id: 4 },
        { question: "Example knowledge quiz question 5?", answer: "Quiz answer 3", id: 5 },
        { question: "Example knowledge quiz question 6?", answer: "Quiz answer 3", id: 6 },
        { question: "Example knowledge quiz question 7?", answer: "Quiz answer 3", id: 7 },
        { question: "Example knowledge quiz question 8?", answer: "Quiz answer 3", id: 8 },
        { question: "Example knowledge quiz question 9?", answer: "Quiz answer 3", id: 9 },
        { question: "Example knowledge quiz question 10?", answer: "Quiz answer 3", id: 10 }
    ]

    return (
        <main className="flex justify-start w-full">
            <div className="flex flex-col w-[75%]">
                <div className="flex">
                    <div className="flex flex-col w-full bg-white p-16 rounded-2xl shadow-custom">
                        <div className="text-2xl font-bold mb-4">Example Course Name Quiz</div>
                        <div className="flex flex-col text-lg space-y-8 w-[30rem]">Course name: Available Course on OpenLMS</div>
                        <div className="flex flex-col text-lg space-y-8 w-[30rem]">Learner name: John Doe</div>
                    </div>
                </div>
                <div className="flex flex-col">
                {TEMP_QUIZ_ANSWER_DATA.map((question, key) => (
                        <QuizAnswer
                            key={key}
                            question={question.question}
                            answer={question.answer}
                            id={question.id}
                        />
                    ))}
                </div>
            </div>
            <div className="flex flex-col bg-white w-[20%] p-16 rounded-2xl shadow-custom fixed right-20">
                <div className="flex justify-center text-lg"><Button text="Submit Graded Quiz" onClick={() => router.push('/home')} filled/></div>
            </div>
        </main>
    )
}