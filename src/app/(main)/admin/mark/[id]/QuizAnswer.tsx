"use client";

import TextField from "@/components/TextField";
import { useEffect, useState } from "react";

export default function QuizAnswer({
    index,
    question,
    answer,
    marks,
    handleMark
} : {
    index: number,
    question: string,
    answer: string,
    marks: string | number,
    handleMark: any
}) {

    const [mark, setMark] = useState("0");

    const updateMark = (mark: string) => {
        const intResult = parseInt(mark, 10);
        if (mark !== "" &&(!Number.isInteger(intResult) || intResult < 0 || intResult > marks)) {
            return;
        }
        setMark(mark);
    }

    useEffect(() => {
        handleMark(index, Number(mark));
    }, [mark]);

    return (
        <div className="flex mt-4">
            <div className="flex flex-row bg-white w-full p-12 rounded-2xl shadow-custom">
                <div className="w-full mr-4">
                    <div className="text-lg mb-2 italic">{question}</div>
                    <div className="text-lg">{answer}</div>
                </div>
                <div className="flex items-center">
                    <div className="flex flex-row items-baseline">
                        <TextField text={mark} onChange={updateMark} style="text-right w-20" />
                        <div className="ml-2 text-xl">/{marks}</div>
                    </div>
                </div>
            </div>
        </div>
    )
}