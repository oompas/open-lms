"use client"
import { useRouter } from "next/navigation";
import Button from "@/components/Button";
import { callApi } from "@/config/firebase";
import { useAsync } from "react-async-hook";
import { MdCheckCircleOutline } from "react-icons/md";
import { useEffect, useState } from "react";

export default function Quiz({ params }: { params: { id: string } }) {

    const router = useRouter();

    const [countdown, setCountDown] = useState(0);

    const getQuizData = useAsync(() =>
        callApi("getQuiz")({ courseId: params.id })
            .then((rsp) => {
                // @ts-ignore
                setCountDown(Math.floor(rsp.data.startTime + (60 * rsp.data.timeLimit) - (Date.now() / 1000)));
                return rsp;
            }),
        []);

    // @ts-ignore
    const quizData: undefined | { questions: any[], timeLimit: number, courseName: number, numAttempts: number, maxAttempts: number, startTime: number }
        = getQuizData.result?.data;
    const [userAnswers, setUserAnswers] = useState({});

    useEffect(() => {
        if (countdown <= 0 || !quizData) {
            return;
        }

        const interval = setInterval(() => setCountDown(Math.floor(quizData.startTime + (60 * quizData.timeLimit) - (Date.now() / 1000))), 1000);
        return () => clearInterval(interval);
    }, [countdown]);

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
                                                    onChange={(e) => setUserAnswers({ ...userAnswers, [question.id]: e.target.value })}
                                                />
                                                <label htmlFor={`option${index}`} className="ml-2">{answer}</label>
                                            </div>
                                        ))
                                        : <input
                                            type="text"
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

        if (!quizData || !quizData.timeLimit) {
            return (
                <div className="flex flex-col text-2xl space-y-8 w-[30rem]">
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
                {quizData && quizData.questions.map((question: any, key: number) => (
                    <div className="flex mt-2">
                        <div className="flex-grow border-[1px] border-gray-300 px-4 py-2 rounded-2xl duration-100 flex items-center">
                            <div className="text-lg">Q{key + 1}</div>
                                { /* @ts-ignore */ }
                                {(userAnswers[question.id] !== undefined && userAnswers[question.id] !== "") && (
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

            if (!value) {
                alert("Please answer all questions before submitting the quiz");
                return;
            }

            const questionData = quizData?.questions.find((question) => question.id === key);
            if (questionData.type === "sa") {
                responses.push({ questionId: key, answer: value });
            } else {
                responses.push({ questionId: key, answer: questionData.answers.indexOf(value) + "" });
            }
        }

        let error = false;
        await callApi("submitQuiz")({ courseId: params.id, responses: responses })
            .then(() => router.push(`/course/${params.id}`))
            .catch((err) => {
                console.error(err);
                error = true;
            });

        if (!error) {
            router.push(`/course/${params.id}`);
        }
    }

    return (
        <main className="flex justify-start w-full h-full">
            <div className="flex flex-col w-[75%]">
                <div className="flex">
                    <div className="flex flex-col w-full bg-white p-12 rounded-2xl shadow-custom">
                        <div className="text-lg font-bold mb-0">{quizData && quizData.courseName}</div>
                        <div className="flex flex-col text-md space-y-8 w-[30rem]">
                            Attempt {quizData && quizData.numAttempts}{quizData && quizData.maxAttempts && `/${quizData.maxAttempts}`}
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
                    <Button text="Submit Quiz" onClick={async () => await handleSubmit() } filled style="mx-auto mt-auto"/>
                </div>
            </div>
            {!quizData && loadingPopup}
        </main>
    )
}
