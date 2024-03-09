"use client"
import {useRouter} from "next/navigation";
import QuizQuestion from "@/app/(main)/quiz/[id]/QuizQuestion";
import QuizProgress from "@/app/(main)/quiz/[id]/QuizProgress";
import Button from "@/components/Button";
import React, { useState } from 'react';

export default function Quiz() {

    const router = useRouter()

    const [isOpen, setIsOpen] = useState(false);

    const TEMP_QUIZ_DATA = [
        { question: "Example knowledge quiz question 1?", options: ["Quiz answer 1", "Quiz answer 2", "Quiz answer 3", "Quiz answer 4"], completed: true, id: 1 },
        { question: "Example knowledge quiz question 2?", options: ["Quiz answer 1", "Quiz answer 2", "Quiz answer 3", "Quiz answer 4"], completed: true, id: 2 },
        { question: "Example knowledge quiz question 3?", options: ["Quiz answer 1", "Quiz answer 2", "Quiz answer 3", "Quiz answer 4"], completed: true, id: 3 },
        { question: "Example knowledge quiz question 4?", options: ["Quiz answer 1", "Quiz answer 2", "Quiz answer 3", "Quiz answer 4"], completed: false, id: 4 },
        { question: "Example knowledge quiz question 5?", options: ["Quiz answer 1", "Quiz answer 2", "Quiz answer 3", "Quiz answer 4"], completed: false, id: 5 },
        { question: "Example knowledge quiz question 6?", options: ["Quiz answer 1", "Quiz answer 2", "Quiz answer 3", "Quiz answer 4"], completed: false, id: 6 },
        { question: "Example knowledge quiz question 7?", options: ["Quiz answer 1", "Quiz answer 2", "Quiz answer 3", "Quiz answer 4"], completed: false, id: 7 },
        { question: "Example knowledge quiz question 8?", options: ["Quiz answer 1", "Quiz answer 2", "Quiz answer 3", "Quiz answer 4"], completed: false, id: 8 },
        { question: "Example knowledge quiz question 9?", options: ["Quiz answer 1", "Quiz answer 2", "Quiz answer 3", "Quiz answer 4"], completed: false, id: 9 },
        { question: "Example knowledge quiz question 10?", options: ["Quiz answer 1", "Quiz answer 2", "Quiz answer 3", "Quiz answer 4"], completed: false, id: 10 }
    ]

    return (
        <main className="flex justify-start pt-14">
            <div className="flex flex-col w-[100%] mb-10">
                <div className="flex">
                    <div className="flex flex-col w-full bg-white p-16 rounded-2xl shadow-custom">
                        <div className="text-2xl font-bold mb-4">Example Course Name Quiz</div>
                        <div className="flex flex-col text-2xl space-y-8 w-[30rem]">Attempt 2/3</div>
                    </div>
                </div>
                <div className="flex flex-col">
                    {TEMP_QUIZ_DATA.map((quiz, key) => (
                        <QuizQuestion
                            key={key}
                            question={quiz.question}
                            options={quiz.options}
                            id={quiz.id}
                        />
                    ))}
                </div>
            </div>
            <button className="flex flex-col bg-[#9D1939] w-[25vh] text-white justify-between items-center mb-8 p-2 fixed bottom-10 right-12" style={{borderColor: "#9D1939"}} onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? 'Hide Quiz Timer' : 'Show Quiz Timer'}
            </button>
            {isOpen && (
                <div className="flex flex-col bg-white w-[20%] p-16 rounded-2xl shadow-custom fixed bottom-40 right-0 border-4" style={{borderColor: "#9D1939"}}>
                    <div className="flex flex-row items-center justify-center">
                        Time remaining:
                    </div>
                    <div className="flex flex-col text-4xl items-center justify-center mb-4">
                        0:13:24
                    </div>
                    <div className="scrollable-list" style={{maxHeight: "40vh", overflowY: "auto"}}>
                        {TEMP_QUIZ_DATA.map((quiz, key) => (
                            <QuizProgress
                                completed={quiz.completed}
                                icon="check"
                                id={quiz.id}
                            />
                        ))}
                    </div>
                    <div className="flex justify-center mt-8"><Button text="Submit Quiz" onClick={() => router.push('/home')} filled/></div>
                </div>
            )}
        </main>
)
}