"use client"
import {useRouter} from "next/navigation";
import Button from "@/components/Button";
import { callApi } from "@/config/firebase";
import { useAsync } from "react-async-hook";
import { MdCheckCircleOutline } from "react-icons/md";
import { useState } from "react";

export default function Quiz({ params }: { params: { id: string } }) {

    const router = useRouter();
    const quizData = useAsync(() => callApi("getQuiz")({ courseId: params.id }), []);

    const [answers, setAnswers] = useState({});

    const loadingPopup = (
        <div
            className="fixed flex justify-center items-center w-[100vw] h-[100vh] top-0 left-0 bg-white bg-opacity-50">
            <div className="flex flex-col w-1/2 bg-white p-12 rounded-xl text-lg shadow-xl">
                <div className="text-lg mb-2">
                    {quizData.loading ? "Loading quiz..." : "Error loading quiz"}
                </div>
            </div>
        </div>
    )

    const renderQuestions = () => {
        return (
            <div>
                { /* @ts-ignore */ }
                {quizData.result?.data && quizData.result.data.map((question, key) => {
                    const answers = question.type === "mc"
                        ? question.answers
                        : question.type === "tf"
                        ? ["True", "False"]
                        : [];

                    return (
                        <div className="flex mt-4">
                            <div className="bg-white w-full p-16 rounded-2xl shadow-custom">
                                <div className="text-2xl mb-8">Q{key + 1}: {question.question}</div>
                                <div className="flex flex-col space-y-4">
                                    {answers.length ? answers.map((answer: string, index: number) => (
                                            // Button selection should eventually set completed to true
                                            <div key={index} className="flex items-center">
                                                <input type="radio" id={`option${index}`} name={`question${key + 1}`}
                                                       value={answer}/>
                                                <label htmlFor={`option${index}`} className="ml-2">{answer}</label>
                                            </div>
                                        ))
                                        : <input type="text" className="border-[1px] border-solid border-black rounded-xl p-4"/>
                                    }
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        )
    }

    const renderProgress = () => {
        return (
            <>
                { /* @ts-ignore */ }
                {quizData.result?.data && quizData.result.data.map((question, key) => (
                    <div className="flex mt-4">
                        <div className="flex-grow border-4 border-gray-300 mb-2 p-4 rounded-2xl duration-100 flex items-center">
                            <div className="text-2xl">Q{key + 1}</div>
                                {question.completed && (
                                    <div className="ml-2">
                                        <MdCheckCircleOutline size={24} />
                                    </div>
                                )}
                        </div>
                    </div>
                ))}
            </>
        );
    }

    return (
        <main className="flex justify-start pt-14">
            <div className="flex flex-col w-[75%]">
                <div className="flex">
                    <div className="flex flex-col w-full bg-white p-16 rounded-2xl shadow-custom">
                        <div className="text-2xl font-bold mb-4">Example Course Name Quiz</div>
                        <div className="flex flex-col text-2xl space-y-8 w-[30rem]">Attempt 2/3</div>
                    </div>
                </div>
                <div className="flex flex-col">
                    {renderQuestions()}
                </div>
            </div>
            <div className="flex flex-col bg-white w-[20%] p-16 rounded-2xl shadow-custom fixed right-20">
                <div className="flex flex-row items-center justify-center">
                    Time remaining:
                </div>
                <div className="flex flex-col text-4xl items-center justify-center mb-4">
                    0:13:24
                </div>
                <div className="scrollable-list" style={{maxHeight: "40vh", overflowY: "auto"}}>
                    {renderProgress()}
                </div>
                <div className="flex justify-center mt-8"><Button text="Submit Quiz" onClick={() => router.push('/home')} filled/></div>
            </div>
            {!quizData.result && loadingPopup}
        </main>
)
}