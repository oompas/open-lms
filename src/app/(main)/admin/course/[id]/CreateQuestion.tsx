"use client"

import Button from "@/components/Button";
import TextField from "@/components/TextField";
import { useState } from "react";

export default function CreateQuestion({
    num,
    data,
    setData,
    closeModal
} : {
    num: number,
    data?: any,
    setData: any,
    closeModal: any
}) {

    const [question, setQuestion] = useState(data ? data.question : "");
    const [qA, setQA] = useState(data ? data.answers[0] : "");
    const [qB, setQB] = useState(data ? data.answers[1] : "");
    const [qC, setQC] = useState(data ? data.answers[2] : "");
    const [qD, setQD] = useState(data ? data.answers[3] : "");
    const [qE, setQE] = useState(data ? data.answers[4] : "");

    const handleSave = () => {
        // TODO - input validation
        var ans = [qA, qB, qC, qD, qE].filter(str => str ? str.trim() !== '' : false);
        setData(num, { question: question, answers: ans });
    }

    return (
        <div className="fixed flex justify-center items-center w-[100vw] h-[100vh] top-0 left-0 bg-white bg-opacity-50">
            <div className="flex flex-col w-1/2 bg-white p-12 rounded-xl text-lg shadow-xl">
                <div className="flex flex-col">
                    <div className="mb-2">Question</div>
                    <TextField text={question} onChange={setQuestion}/>
                </div>
                <div className="flex flex-col space-y-2 mt-4">
                    <div className="-mb-3">Answers</div>
                    <div className="text-sm text-gray-600">Leave these fields blank to create a short answer question.</div>
                    <div className="flex flex-row space-x-2 items-center">
                        <div className="text-xl w-6">a)</div>
                        <TextField text={qA} onChange={setQA} style="w-full" />
                    </div>
                    <div className="flex flex-row space-x-2 items-center">
                        <div className="text-xl w-6">b)</div>
                        <TextField text={qB} onChange={setQB} style="w-full" />
                    </div>
                    <div className="flex flex-row space-x-2 items-center">
                        <div className="text-xl w-6">c)</div>
                        <TextField text={qC} onChange={setQC} style="w-full" />
                    </div>
                    <div className="flex flex-row space-x-2 items-center">
                        <div className="text-xl w-6">d)</div>
                        <TextField text={qD} onChange={setQD} style="w-full" />
                    </div>
                    <div className="flex flex-row space-x-2 items-center">
                        <div className="text-xl w-6">e)</div>
                        <TextField text={qE} onChange={setQE} style="w-full" />
                    </div>
                </div>
                <div className="flex flex-row space-x-4 mt-6">
                    <Button text="Cancel" onClick={closeModal} style="ml-auto"/>
                    <Button text="Save Question" onClick={() => handleSave()} filled/>
                </div>
            </div>
        </div>
    )
}