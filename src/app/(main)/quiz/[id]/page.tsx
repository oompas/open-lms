"use client"
import { useRouter } from "next/navigation";
import Button from "@/components/Button";
import React, { useState, useEffect } from 'react';
import { auth, callApi } from "@/config/firebase";
import { useAsync } from "react-async-hook";
import { MdCheckCircleOutline } from "react-icons/md";

export default function Quiz({ params }: { params: { id: string } }) {

    const router = useRouter();

    // if user is Admin - go to admin tools
    auth.onAuthStateChanged((user) => {
        if (user) {
            auth.currentUser?.getIdTokenResult()
                .then((idTokenResult) => !!idTokenResult.claims.admin ? router.replace("/admin/tools") : null)
                .catch((error) => console.log(`Error fetching user ID token: ${error}`));
        }
    });
  
    const [countdown, setCountDown] = useState(0);

    const getQuizData = useAsync(() =>
        callApi("getQuiz", { quizAttemptId: params.id.split('-')[1] })
            .then((rsp) => {
                if (rsp.data === "Invalid") {
                    return rsp;
                }

                // @ts-ignore
                setCountDown(Math.floor(rsp.data.startTime + (60 * rsp.data.timeLimit) - (Date.now() / 1000)));
                // @ts-ignore
                setUserAnswers(rsp.data.questions.map(question => question.id).reduce((prev: any, cur: any) => ({ ...prev, [cur]: null }), {}));
                return rsp;
            }),
        []);

    // @ts-ignore
    const quizData: undefined | "Invalid" | { questions: any[], timeLimit: number, courseName: number, numAttempts: number, maxAttempts: number, startTime: number }
        = getQuizData.result?.data;
    const [userAnswers, setUserAnswers] = useState({});

    useEffect(() => {
        if (countdown === 0 && quizData && quizData !== "Invalid") { // Automatically submit quiz when time runs out
            handleSubmit();
        }
        if (countdown < 0 || !quizData || quizData == "Invalid") {
            return;
        }

        const interval = setInterval(() => setCountDown(Math.floor(quizData.startTime + (60 * quizData.timeLimit) - (Date.now() / 1000))), 1000);
        return () => clearInterval(interval);
    }, [countdown, quizData]);

    const loadingPopup = () => {
        let text;
        if (getQuizData.loading) {
            text = "Loading quiz...";
        } else if (quizData === "Invalid") {
            text = "You did not submit this quiz in time, so it has expired";
        } else {
            text = "Error loading quiz";
        }

        return (
            <div
                className="fixed flex justify-center items-center w-[100vw] h-[100vh] top-0 left-0 bg-white bg-opacity-50">
                <div className="flex flex-col w-1/2 bg-white p-12 rounded-xl text-lg shadow-xl">
                    <div className="text-lg mb-2">
                        {text}
                        {quizData === "Invalid" &&
                            <>
                                <br/>
                                <button
                                    onClick={() => router.push(`/course/${params.id.split('-')[0]}`)}
                                    className={"mt-4 bg-blue-500 text-white rounded-xl p-2"}
                                >
                                    Return to course
                                </button>
                            </>
                        }
                    </div>
                </div>
            </div>
        );
    }

    const renderQuestions = () => {
        return (
            <div>
                {quizData && quizData !== "Invalid" && quizData.questions.map((question, key) => {
                    const answers = question.type === "mc"
                        ? question.answers
                        : question.type === "tf"
                            ? ["True", "False"]
                            : [];

                    return (
                        <div className="flex mt-4 mb-4">
                            <div className="bg-white w-full p-12 rounded-2xl shadow-custom">
                                <div className="text-xl mb-4">Q{key + 1}: {question.question} <div className="text-sm"><i>{question.marks} mark{question.marks === 1 ? "" : "s"}</i></div></div>
                                <div className="flex flex-col space-y-2">
                                    {answers.length ? answers.map((answer: string, index: number) => (
                                            <div key={index} className="flex items-center">
                                                <input
                                                    type="radio"
                                                    id={index + 1 + ""}
                                                    name={`question${key + 1}`}
                                                    value={answer}
                                                    onChange={(e) => setUserAnswers({ ...userAnswers, [question.id]: e.target.value })}
                                                />
                                                <label htmlFor={`option${index}`} className="ml-2">{answer}</label>
                                            </div>
                                        ))
                                        : 
                                        <textarea
                                            className="border-[1px] border-solid border-black rounded-xl p-4"
                                            onChange={(e) => setUserAnswers({...userAnswers, [question.id]: e.target.value})}
                                        />
                                    }
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        )
    }

    const renderTimeLimit = () => {
        if (!getQuizData.result?.data) {
            return <></>;
        }

        if (!quizData || quizData === "Invalid" || !quizData.timeLimit) {
            return (
                <div className="flex flex-col text-2xl text-center space-y-8 mb-4">
                    <i>No time limit</i>
                </div>
            );
        }

        const timeFormat = (Math.floor(countdown / 3600) + "").padStart(2, '0') + ":"
            + (Math.floor(countdown / 60) % 60 + "").padStart(2, '0') + ":" + (countdown % 60 + "").padStart(2, '0');

        return (
            <>
                <div className="flex flex-row items-center justify-center">
                    Time remaining:
                </div>
                <div className="flex flex-col text-4xl items-center justify-center mb-4">
                    {timeFormat}
                </div>
            </>
        );
    }

    const renderProgress = () => {
        return (
            <>
                {quizData && quizData !== "Invalid" && quizData.questions.map((question: any, key: number) => (
                    <div className="flex mt-2">
                        <div className="flex-grow border-[1px] border-gray-300 px-4 py-2 rounded-2xl duration-100 flex items-center justify-center">
                            <div className="text-lg">Q{key + 1}</div>
                            { /* @ts-ignore */ }
                            {(userAnswers[question.id] !== null && userAnswers[question.id] !== "") && (
                                <div className="ml-2">
                                    <MdCheckCircleOutline size={24} className="mx-auto" color="#47AD63"/>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </>
        );
    }

    const handleSubmit = async () => {

        const responses = [];
        for (const [key, value] of Object.entries(userAnswers)) {

            if (value === null) {
                alert("Please answer all questions before submitting the quiz");
                return;
            }

            // @ts-ignore
            const questionData = quizData?.questions.find((question) => question.id === key);
            if (questionData.type === "sa") {
                responses.push({ questionId: key, answer: value });
            } else if (questionData.type === "tf") {
                responses.push({ questionId: key, answer: value === "True" ? "0" : "1" });
            } else {
                responses.push({ questionId: key, answer: questionData.answers.indexOf(value) + "" });
            }
        }

        await callApi("submitQuiz", { quizAttemptId: params.id.split('-')[1], responses: responses })
            .then(() => router.push(`/course/${params.id.split('-')[0]}`))
            .catch((err) => console.log(`Error calling submitQuiz: ${err}`));
    }

    return (
        <main className="flex justify-between w-full h-full pb-4">
            <div className="flex flex-col w-[75%] h-full overflow-y-scroll sm:no-scrollbar rounded-2xl">
                <div className="flex">
                    <div className="flex flex-col w-full bg-white p-12 rounded-2xl shadow-custom">
                        <div className="text-lg font-bold mb-0">{quizData && quizData !== "Invalid" && quizData.courseName}</div>
                        <div className="flex flex-col text-md space-y-8 w-[30rem]">
                            Attempt {quizData && quizData !== "Invalid" && quizData.numAttempts}{quizData && quizData !== "Invalid" && quizData.maxAttempts && `/${quizData.maxAttempts}`}
                        </div>
                    </div>
                </div>
                <div className="flex flex-col">
                    {renderQuestions()}
                </div>
            </div>
            <div className="flex flex-col bg-white w-[23%] h-full p-12 rounded-2xl shadow-custom">
                {renderTimeLimit()}
                <div className="flex flex-col h-full mb-4 overflow-y-scroll sm:no-scrollbar">
                    {renderProgress()}
                </div>
                <div className="flex justify-center mt-8">
                    <Button text="Submit Quiz" onClick={async () => await handleSubmit() } filled style="mx-auto mt-auto"/>
                </div>
            </div>
            {(!quizData || quizData === "Invalid") && loadingPopup()}
        </main>
    )
}
