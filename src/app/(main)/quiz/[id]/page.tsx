"use client"
import { useRouter } from "next/navigation";
import Button from "@/components/Button";
import { callApi } from "@/config/firebase";
import { useAsync } from "react-async-hook";
import { MdCheckCircleOutline } from "react-icons/md";
import { useState } from "react";

export default function Quiz({ params }: { params: { id: string } }) {

    const router = useRouter();
    const getQuizData = useAsync(() => callApi("getQuiz")({ courseId: params.id }), []);

    // @ts-ignore
    const quizData: null | { questions: any[], timeLimit: number, courseName: number, attempt: number, maxAttempts: number }
        = getQuizData.result?.data;
    const [userAnswers, setUserAnswers] = useState({});

    const loadingPopup = (
        <div
            className="fixed flex justify-center items-center w-[100vw] h-[100vh] top-0 left-0 bg-white bg-opacity-50">
            <div className="flex flex-col w-1/2 bg-white p-12 rounded-xl text-lg shadow-xl">
                <div className="text-lg mb-2">
                    {getQuizData.loading ? "Loading quiz..." : "Error loading quiz"}
                </div>
            </div>
        </div>
    )

    const renderQuestions = () => {
        return (
            <div>
                {quizData && quizData.questions.map((question, key) => {
                    const answers = question.type === "mc"
                        ? question.answers
                        : question.type === "tf"
                        ? ["True", "False"]
                        : [];

                    return (
                        <div className="flex mt-4 mb-4">
                            <div className="bg-white w-full p-12 rounded-2xl shadow-custom">
                                <div className="text-xl mb-4">Q{key + 1}: {question.question}</div>
                                <div className="mb-6"><i>{question.marks} mark{question.marks === 1 ? "" : "s"}</i></div>
                                <div className="flex flex-col space-y-2">
                                    {answers.length ? answers.map((answer: string, index: number) => (
                                            <div key={index} className="flex items-center">
                                                <input
                                                    type="radio"
                                                    id={index + 1 + ""}
                                                    name={`question${key + 1}`}
                                                    value={answer}
                                                    onChange={() => setUserAnswers({ ...userAnswers, [key+1]: index })}
                                                />
                                                <label htmlFor={`option${index}`} className="ml-2">{answer}</label>
                                            </div>
                                        ))
                                        : <input
                                            type="text"
                                            className="border-[1px] border-solid border-black rounded-xl p-4"
                                            onChange={(e) => setUserAnswers({...userAnswers, [key+1]: e.target.value})}
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

        if (!quizData || !quizData.timeLimit) {
            return (
                <div className="flex flex-col text-2xl space-y-8 w-[30rem]">
                    <i>No time limit</i>
                </div>
            );
        }

        return (
            <>
                <div className="flex flex-row items-center justify-center">
                    Time remaining:
                </div>
                <div className="flex flex-col text-4xl items-center justify-center mb-4">
                    {quizData.timeLimit}
                </div>
            </>
        );
    }

    const renderProgress = () => {
        return (
            <>
                {quizData && quizData.questions.map((_: any, key: number) => (
                    <div className="flex mt-2">
                        <div className="flex-grow border-[1px] border-gray-300 px-4 py-2 rounded-2xl duration-100 flex items-center">
                            <div className="text-lg">Q{key + 1}</div>
                                { /* @ts-ignore */ }
                                {(userAnswers[key + 1] !== undefined && userAnswers[key + 1] !== "") && (
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

    return (
        <main className="flex justify-start w-full h-full">
            <div className="flex flex-col w-[75%]">
                <div className="flex">
                    <div className="flex flex-col w-full bg-white p-12 rounded-2xl shadow-custom">
                        <div className="text-lg font-bold mb-0">{quizData && quizData.courseName}</div>
                        <div className="flex flex-col text-md space-y-8 w-[30rem]">
                            Attempt {quizData && quizData.attempt}{quizData && quizData.maxAttempts && `/${quizData.maxAttempts}`}
                        </div>
                    </div>
                </div>
                <div className="flex flex-col">
                    {renderQuestions()}
                </div>
            </div>
            <div className="flex flex-col bg-white w-[20%] h-[82%] p-12 rounded-2xl shadow-custom fixed right-20">
                {renderTimeLimit()}
                <div className="flex flex-col h-full mb-4 overflow-y-scroll sm:no-scrollbar">
                    {renderProgress()}
                </div>
                <div className="flex justify-center mt-8">
                    <Button text="Submit Quiz" onClick={() => router.push('/home')} filled style="mx-auto mt-auto"/>
                </div>
            </div>
            {!quizData && loadingPopup}
        </main>
    )
}
