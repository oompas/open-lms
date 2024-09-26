"use client"
import {useRouter} from "next/navigation";
import QuizAnswer from "@/app/(main)/admin/mark/[id]/QuizAnswer";
import Button from "@/components/Button";
import React, { useEffect, useState } from "react";
import { ApiEndpoints, callApi } from "@/config/firebase";
import { RiCheckboxBlankCircleLine, RiCheckboxCircleFill } from "react-icons/ri";
import { FaRegTimesCircle } from "react-icons/fa";
import { callAPI } from "@/config/supabase.ts";
import { useAsync } from "react-async-hook";

export default function Mark({ params }: { params: { id: string } }) {

    const router = useRouter();

    const quizQuestions = useAsync(() => callAPI('get-quiz-attempt', { quizAttemptId: params.id }).then((rsp) => { setQuestions(rsp.data); return rsp; }));

    const [questions, setQuestions] = useState(null);
    const [marks, setMarks] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [score, setScore] = useState(0);
    const [marked, setMarked] = useState(0);
    const [viewOnly, setViewOnly] = useState(false);

    useEffect(() => {
        if (!questions) {
            return;
        }

        // @ts-ignore
        const view = questions.score != null
        
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
        setViewOnly(view)
    }, [questions])

    const handleUpdateMark = (index: number, mark: number) => {
        const temp_marks = [...marks]
        let temp_sum = 0
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

    const handleSubmit = async () => {
        const responses = [];
        questions.saQuestions.map((q, key) => responses.push({ questionAttemptId: q.questionAttemptId, marksAchieved: marks[key] }));
        callApi(ApiEndpoints.MarkQuizAttempt, { quizAttemptId: params.id, responses: responses })
            .then(() => router.replace("/admin/tools"));
    }

    /**
     * Render a question answer:
     * -Not checked and not correct answer: blank black circle, black text
     * -Checked and correct answer: checked green circle, green text
     * -Checked and not correct answer: checked red circle, red text
     * -Not checked but correct answer: blank green circle, green text
     */
    const renderQuestionAnswer = (answer: string, checked: boolean, correctAnswer: boolean) => {

        const buttonColor = checked ? (correctAnswer ? "green" : "red") : (correctAnswer ? "green" : "black");
        const button = checked
            ? (correctAnswer
                ? <RiCheckboxCircleFill size={24} color={buttonColor}/>
                : <FaRegTimesCircle size={24} color={buttonColor}/>)
            : <RiCheckboxBlankCircleLine size={24} color={buttonColor}/>;
        const textColor = checked ? (correctAnswer ? "text-green-600" : "text-red-600") : (correctAnswer ? "text-green-600" : "text-black");

        return (
            <div className="flex mb-2">
                {button}
                <div className={"ml-1 " + (textColor)}>{answer}</div>
            </div>
        );
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
                        {/* @ts-ignore */}
                        <div className="flex flex-col text-lg space-y-8 w-[30rem]">Completion Date: {questions && new Date(questions.completionTime * 1000).toLocaleString()}</div>
                        {/* @ts-ignore */}
                        { questions && questions.markingInfo && 
                        <div> 
                            {/* @ts-ignore */}
                            <div className="flex flex-col text-lg space-y-8 w-[30rem] mt-2">Marked by: {questions && `${questions.markingInfo?.name} (${questions.markingInfo?.email})`}</div>
                            {/* @ts-ignore */}
                            <div className="flex flex-col text-lg space-y-8 w-[30rem]">Marked on: {questions && new Date(questions.markingInfo?.markTime._seconds * 1000).toLocaleString()}</div>
                        </div> }
                    </div>
                </div>

                <div className="flex flex-col">
                    {/* @ts-ignore */}
                    {!viewOnly && questions && questions.saQuestions.map((question, key) => (
                        <QuizAnswer
                            key={key}
                            index={key}
                            question={question.question}
                            answer={question.response}
                            marks={question.marks}
                            handleMark={handleUpdateMark}
                        />
                    ))}
                </div>
                {!viewOnly && <div className="text-center mt-4">Automatically Marked Questions</div> }
                <div className="flex flex-col mt-4 space-y-4">
                    {/* @ts-ignore */}
                    {viewOnly && questions && questions.saQuestions.map((question, key) => (
                        <div className="flex flex-row bg-white py-4 px-12 rounded-xl">
                            <div className="flex flex-col w-full">
                                <div className="text-lg w-full mb-2">{question.question}</div>
                                <div className="text-lg w-full">A) {question.response}</div>
                            </div>
                            <div className="text-xl w-16">{question.marksAchieved}/{question.marks}</div>
                        </div>
                    ))}
                    {/* @ts-ignore */}
                    {questions && questions.otherQuestions.map((question, key) => (
                        <div className="flex flex-row items-center bg-white py-4 px-12 rounded-xl">
                            <div className="flex flex-col w-full">
                                <div className="text-lg w-full mb-2">{question.question}</div>
                                <div>
                                    {question.type === "TF" ?
                                        <>
                                            <div className="text-lg w-full">
                                                {renderQuestionAnswer("True", question.response === 0, question.correctAnswer === 0)}
                                                {renderQuestionAnswer("False", question.response === 1, question.correctAnswer === 1)}
                                            </div>
                                        </>
                                    :
                                        <div className="text-lg w-full">
                                            { question.answers.map((ans, key) => {
                                                return renderQuestionAnswer(ans, question.response === key, key === question.correctAnswer);
                                            })}
                                        </div>
                                    }
                                </div>
                            </div>
                            <div className="text-xl w-16">{question.marksAchieved}/{question.marks}</div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="flex flex-col bg-white w-[23%] p-12 rounded-2xl shadow-custom">
                <div className="text-center">Total Score</div>
                <div className="flex flex-row items-center justify-center text-3xl border py-3 rounded-xl mt-2">
                    <div className="font-bold">
                        {/* @ts-ignore */}
                        {viewOnly ? questions.score : marked+score}
                    </div>
                    <div className="ml-1 text-gray-500">{"/"}</div>
                    <div className="text-gray-500">
                        {total}
                    </div>
                </div>
                {!viewOnly && <Button text="Submit Graded Quiz" onClick={() => handleSubmit()} filled style="mt-auto mx-auto" />}
            </div>
            {loadingPopup()}
        </main>
    )
}