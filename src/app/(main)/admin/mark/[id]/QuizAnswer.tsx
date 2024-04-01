"use client";

import TextField from "@/components/TextField";
import { useEffect, useState } from "react";

export default function QuizAnswer({
    index,
    question,
    answer,
    marks,
    handleMark,
    id
} : {
    index: number,
    question: string,
    answer: string,
    marks: string | number,
    handleMark: any,
    id: number
}) {

    const [mark, setMark] = useState("0")

    const isValid = (str: string) => {
        var n = Math.floor(Number(str));
        return n !== Infinity && String(n) === str && n >= 0;
    }

    useEffect(() => {
        if (isValid(mark))
            handleMark(index, Number(mark))
    }, [mark])

    return (
        <div className="flex mt-4">
            <div className="flex flex-row bg-white w-full p-12 rounded-2xl shadow-custom">
                <div className="w-full mr-4">
                    <div className="text-lg mb-2">{question}</div>
                    <div className="text-lg">A) {answer}</div>
                </div>
                <div className="flex items-center">
                    <div className="flex flex-row items-baseline">
                        <TextField text={mark} onChange={setMark} style="text-right w-20" />
                        <div className="ml-2 text-xl">/{marks}</div>
                    </div>
                </div>
            </div>
        </div>
    )
}