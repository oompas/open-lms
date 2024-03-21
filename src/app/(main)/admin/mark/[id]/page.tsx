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
        callApi('getQuizToMark')({ quizAttemptId: params.id }) // @ts-ignore
            .then((rsp) => { setQuestions(rsp.data); return rsp; }),
        []);

    const [questions, setQuestions] = useState(null);
    const [marks, setMarks] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [score, setScore] = useState(0);

    useEffect(() => {
        if (!questions) {
            return;
        }

        const temp_marks: any[] = [];
        let temp = 0;
        questions.saQuestions.map((q, i) => {
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

    return (
        <main className="flex h-auto w-full mb-4 justify-between">
            <div className="flex flex-col w-[75%] overflow-y-scroll sm:no-scrollbar">
                <div className="flex">
                    <div className="flex flex-col w-full bg-white p-12 rounded-2xl shadow-custom">
                        <div className="text-2xl font-bold mb-4">{questions && questions.courseName}</div>
                        <div className="flex flex-col text-lg space-y-8 w-[30rem]">Learner name: {questions && questions.learnerName}</div>
                    </div>
                </div>
                <div className="flex flex-col">
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
            </div>
            <div className="flex flex-col bg-white w-[23%] p-12 rounded-2xl shadow-custom">
                <div className="text-center">Total Score</div>
                <div className="flex flex-row items-center justify-center text-3xl border py-3 rounded-xl mt-2">
                    <div className="font-bold">
                        todo
                    </div>
                    <div className="ml-1 text-gray-500">{"/"}</div>
                    <div className="text-gray-500">
                        {questions && questions.saQuestions.map(q => q.marks).concat(questions.otherQuestions.map(q => q.marks)).reduce((partialSum, a) => partialSum + a, 0)}
                    </div>
                </div>
                <Button text="Submit Graded Quiz" onClick={() => router.push('/home')} filled style="mt-auto" />
            </div>
            {loadingPopup()}
        </main>
    )
}