"use client"
import {useRouter} from "next/navigation";
import QuizAnswer from "@/app/(main)/admin/mark/[id]/QuizAnswer";
import Button from "@/components/Button";
import React, { useEffect, useState } from "react";
import { useAsync } from "react-async-hook";
import { callApi } from "@/config/firebase";

export default function Mark({ params }: { params: { id: string } }) {

    const router = useRouter();

    const quizQuestions = useAsync(() =>
        callApi('getQuizToMark', { quizAttemptId: params.id }) // @ts-ignore
            .then((rsp) => { setQuestions(rsp.data); return rsp; }),
        []);

    const [questions, setQuestions] = useState(null);
    const [marks, setMarks] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [score, setScore] = useState(0);
    const [marked, setMarked] = useState(0);

    useEffect(() => {
        if (!questions) {
            return;
        }
        
        const temp_marks: any[] = [];
        let temp_total = 0;
        let temp_score = 0;
        // @ts-ignore
        questions.saQuestions.map((q, i) => {
            temp_marks.push(0)
            temp_total += q.marks
        })
        // @ts-ignore
        questions.otherQuestions.map((q, i) => {
            temp_marks.push(0)
            temp_total += q.marks
            temp_score += q.marksAchieved
        })
        setMarks(temp_marks)
        setTotal(temp_total)
        setMarked(temp_score)
    }, [questions])

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

    const loadingPopup = () => {
        if (quizQuestions.result?.data) {
            return <></>;
        }

        return (
            <div
                className="fixed flex justify-center items-center w-[100vw] h-[100vh] top-0 left-0 bg-white bg-opacity-50">
                <div className="flex flex-col w-1/2 bg-white p-12 rounded-xl text-lg shadow-xl">
                    <div className="text-lg mb-2">
                        {quizQuestions.loading ? "Loading quiz questions..." : "Error loading quiz questions"}
                    </div>
                </div>
            </div>
        );
    }

    const handleSubmit = () => {
        router.push('/admin/tools');
    }

    return (
        <main className="flex h-auto w-full mb-4 justify-between">
            <div className="flex flex-col w-[75%] overflow-y-scroll sm:no-scrollbar">
                <div className="flex">
                    <div className="flex flex-col w-full bg-white p-12 rounded-2xl shadow-custom">
                        {/* @ts-ignore */}
                        <div className="text-2xl font-bold mb-2">{questions && questions.courseName}</div>
                        {/* @ts-ignore */}
                        <div className="flex flex-col text-lg space-y-8 w-[30rem]">Learner: {questions && questions.learnerName}</div>
                    </div>
                </div>

                <div className="flex flex-col">
                    {/* @ts-ignore */}
                    {questions && questions.saQuestions.map((question, key) => (
                        <QuizAnswer
                            key={key}
                            index={key}
                            question={question.question}
                            answer={question.response}
                            marks={question.marks}
                            handleMark={handleUpdateMark}
                            id={question.id}
                        />
                    ))}
                </div>
                <div className="text-center mt-4">Automatically Marked Questions</div>
                <div className="flex flex-col mt-4 space-y-4">
                    {/* @ts-ignore */}
                    {questions && questions.otherQuestions.map((question, key) => (
                        <div className="flex flex-row bg-white py-4 px-12 rounded-xl">
                            <div className="text-lg w-full">Q) {question.question}</div>
                            <div className="text-xl w-16">{question.marksAchieved}/{question.marks}</div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="flex flex-col bg-white w-[23%] p-12 rounded-2xl shadow-custom">
                <div className="text-center">Total Score</div>
                <div className="flex flex-row items-center justify-center text-3xl border py-3 rounded-xl mt-2">
                    <div className="font-bold">
                        {marked+score}
                    </div>
                    <div className="ml-1 text-gray-500">{"/"}</div>
                    <div className="text-gray-500">
                        {total}
                    </div>
                </div>
                <Button text="Submit Graded Quiz" onClick={() => handleSubmit()} filled style="mt-auto mx-auto" />
            </div>
            {loadingPopup()}
        </main>
    )
}