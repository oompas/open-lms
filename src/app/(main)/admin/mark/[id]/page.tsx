"use client"
import {useRouter} from "next/navigation";
import QuizAnswer from "@/app/(main)/admin/mark/[id]/QuizAnswer";
import Button from "@/components/Button";
import { useEffect, useState } from "react";

export default function Mark() {

    const router = useRouter()

    const TEMP_QUIZ_ANSWER_DATA = [
        { question: "Example knowledge quiz question 1?", answer: "Quiz answer 3", marks: 4, marksEarned: null,  id: 1 },
        { question: "Example knowledge quiz question 1?", answer: "Quiz answer 3", marks: 4, marksEarned: null,  id: 2 },
        { question: "Example knowledge quiz question 1?", answer: "Quiz answer 3", marks: 4, marksEarned: null,  id: 3 },
        { question: "Example knowledge quiz question 1?", answer: "Quiz answer 3", marks: 4, marksEarned: null,  id: 4 }
    ]
    const [questions, setQuestions] = useState(TEMP_QUIZ_ANSWER_DATA);
    const [marks, setMarks] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [score, setScore] = useState(0);

    useEffect(() => {
        var temp_marks: any[] = [];
        var temp = 0;
        questions.map((q, i) => {
            temp_marks.push(0)
            temp += q.marks
        })
        setMarks(temp_marks)
        setTotal(temp)
    }, [])

    const handleUpdateMark = (index: number, mark: number) => {
        var temp_marks = [...marks]
        var temp_sum = 0
        temp_marks[index] = mark
        temp_marks.map((n) => {
            temp_sum += n
        })
        setMarks(temp_marks)
        setScore(temp_sum)
    }

    return (
        <main className="flex h-auto w-full mb-4 justify-between">
            <div className="flex flex-col w-[75%] overflow-y-scroll sm:no-scrollbar">
                <div className="flex">
                    <div className="flex flex-col w-full bg-white p-12 rounded-2xl shadow-custom">
                        <div className="text-2xl font-bold mb-4">Example Course Name Quiz</div>
                        <div className="flex flex-col text-lg space-y-8 w-[30rem]">Course name: Available Course on OpenLMS</div>
                        <div className="flex flex-col text-lg space-y-8 w-[30rem]">Learner name: John Doe</div>
                    </div>
                </div>
                <div className="flex flex-col">
                {questions.map((question, key) => (
                        <QuizAnswer
                            key={key}
                            index={key}
                            question={question.question}
                            answer={question.answer}
                            marks={question.marks}
                            handleMark={handleUpdateMark}
                            id={question.id}
                        />
                    ))}
                </div>
            </div>
            <div className="flex flex-col bg-white w-[23%] p-12 rounded-2xl shadow-custom">
                <div className="text-center">Total Score</div>
                <div className="flex flex-row items-center justify-center text-3xl border py-3 rounded-xl mt-2">
                    <div className="font-bold">{score}</div>
                    <div className="ml-1 text-gray-500">{"/"}</div>
                    <div className="text-gray-500">{total}</div>
                </div>
                <Button text="Submit Graded Quiz" onClick={() => router.push('/home')} filled style="mt-auto" />
            </div>
        </main>
    )
}