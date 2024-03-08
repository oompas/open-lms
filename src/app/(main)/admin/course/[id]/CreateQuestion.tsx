"use client"

import Button from "@/components/Button";
import Checkbox from "@/components/Checkbox";
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

    const [type, setType] = useState(data ? data.type : "");

    const [question, setQuestion] = useState(data ? data.question : "");
    const [answer, setAnswer] = useState(data ? data.type === "mc" ? data.options[data.answer] : data.answer : -1);
    const [qA, setQA] = useState(data ? data.options[0] : "");
    const [qB, setQB] = useState(data ? data.options[1] : "");
    const [qC, setQC] = useState(data ? data.options[2] : "");
    const [qD, setQD] = useState(data ? data.options[3] : "");
    const [qE, setQE] = useState(data ? data.options[4] : "");

    const handleSave = () => {
        // TODO - actual input validation (regex to check for allowed values?)
        var opts = [qA, qB, qC, qD, qE].filter(str => str ? str.trim() !== '' : false);
        var ans = answer;

        if (question === "") {
            alert("Make sure to write a question.")
            return;
        } else if (type === "mc" && opts.length < 2) {
            alert("Provide at least two answer options.")
            return;
        } else if (type != "sa" && answer === -1) {
            alert("Select a correct answer.")
            return;
        }
        if (type === "mc") {
            ans = opts.indexOf(answer);
            if (ans === -1) {
                alert("Please select a correct answer.");
                return;
            }
        }
        setData(num, { type: type, question: question, options: opts, answer: ans });
    }

    const checkNumQuestionsValid = () => {
        return [qA, qB, qC, qD, qE].filter(str => str ? str.trim() !== '' : false).length < 2;
    }

    const questionType = (
        <div className="flex flex-col">
            <div className="mb-4">Select a question type:</div>
            <div className="flex flex-row justify-between space-x-6">
                <button 
                    className="flex flex-col w-full justify-center items-center border-[3px] border-red-800 p-4 rounded-xl text-red-800 font-bold hover:opacity-60 duration-75"
                    onClick={() => setType("mc")}
                >
                    Multiple Choice
                </button>
                <button 
                    className="flex flex-col w-full justify-center items-center border-[3px] border-red-800 p-4 rounded-xl text-red-800 font-bold hover:opacity-60 duration-75"
                    onClick={() => {setQA("True"); setQB("False"); setType("tf")}}
                >
                    True or False
                </button>
                <button 
                    className="flex flex-col w-full justify-center items-center border-[3px] border-red-800 p-4 rounded-xl text-red-800 font-bold hover:opacity-60 duration-75"
                    onClick={() => setType("sa")}
                >
                    Short Answer
                </button>
            </div>
            <div className="flex flex-row space-x-4 mt-6">
                <Button text="Cancel" onClick={closeModal} style="ml-auto"/>
            </div>
        </div>
    )

    const multipleChoice = (
        <div>
            <div className="flex flex-col">
                <div className="">Question</div>
                { question ? null : <div className="text-sm text-red-500">Write a question.</div> }
                <TextField text={question} onChange={setQuestion} area style="mt-3"/>
            </div>
            <div className="flex flex-col space-y-2 mt-4">
                <div>
                    <div className="">Answers</div>
                    <div className="text-sm text-gray-600 mb-1">Check off the correct answer.</div>
                    { checkNumQuestionsValid() ? <div className="text-sm text-red-500">Provide at least two answer options.</div> : null }
                    { answer != -1 ? null : <div className="text-sm text-red-500">Select a correct answer.</div> }
                </div>
                <div className="flex flex-row space-x-2 items-center mt-3">
                    <Checkbox checked={answer === qA} setChecked={() => { qA ? setAnswer(qA) :  null}} style="h-11 w-11" disabled={qA === ""} />
                    <TextField text={qA} onChange={setQA} style="w-full" />
                </div>
                <div className="flex flex-row space-x-2 items-center">
                    <Checkbox checked={answer === qB} setChecked={() => { qB ? setAnswer(qB) :  null}} style="h-11 w-11" disabled={qB === ""} />
                    <TextField text={qB} onChange={setQB} style="w-full" />
                </div>
                <div className="flex flex-row space-x-2 items-center">
                    <Checkbox checked={answer === qC} setChecked={() => { qC ? setAnswer(qC) :  null}} style="h-11 w-11" disabled={qC === ""} />
                    <TextField text={qC} onChange={setQC} style="w-full" />
                </div>
                <div className="flex flex-row space-x-2 items-center">
                    <Checkbox checked={answer === qD} setChecked={() => { qD ? setAnswer(qD) :  null}} style="h-11 w-11" disabled={qD === ""} />
                    <TextField text={qD} onChange={setQD} style="w-full" />
                </div>
                <div className="flex flex-row space-x-2 items-center">
                    <Checkbox checked={answer === qE} setChecked={() => { qE ? setAnswer(qE) :  null}} style="h-11 w-11" disabled={qE === ""} />
                    <TextField text={qE} onChange={setQE} style="w-full" />
                </div>
            </div>
            <div className="flex flex-row space-x-4 mt-6">
                <Button text="Cancel" onClick={closeModal} style="ml-auto"/>
                <Button text="Save Question" onClick={() => handleSave()} filled disabled={!question || checkNumQuestionsValid() || answer === -1}/>
            </div>
        </div>
    )

    const trueFalse = (
        <div>
            <div className="flex flex-col">
                <div className="">Question</div>
                { question ? null : <div className="text-sm text-red-500">Write a question.</div> }
                <TextField text={question} onChange={setQuestion} area style="mt-2"/>
            </div>
            <div className="flex flex-col space-y-2 mt-4">
                <div>
                    <div className="">Answers</div>
                    <div className="text-sm text-gray-600 mb-1">Check off the correct answer.</div>
                    { answer != -1 ? null : <div className="text-sm text-red-500">Select a correct answer.</div> }
                </div>
                <div className="flex flex-row space-x-2 items-center">
                    <Checkbox checked={answer === 0} setChecked={() => setAnswer(0)} style="h-11 w-11" />
                    <TextField text={qA} onChange={setQA} style="w-full" readonly/>
                </div>
                <div className="flex flex-row space-x-2 items-center">
                    <Checkbox checked={answer === 1} setChecked={() => setAnswer(1)} style="h-11 w-11" />
                    <TextField text={qB} onChange={setQB} style="w-full" readonly />
                </div>
            </div>
            <div className="flex flex-row space-x-4 mt-6">
                <Button text="Cancel" onClick={closeModal} style="ml-auto"/>
                <Button text="Save Question" onClick={() => handleSave()} filled disabled={answer === -1 || !question}/>
            </div>
        </div>
    )

    const shortAnswer = (
        <div>
            <div className="flex flex-col">
                <div className="">Question</div>
                <div className="text-sm text-gray-600">Short answer questions must be manually marked after a quiz is submitted.</div>
                { question ? null : <div className="text-sm text-red-500">Write a question.</div> }
                <TextField text={question} onChange={setQuestion} area style="mt-3"/>
            </div>
            <div className="flex flex-row space-x-4 mt-6">
                <Button text="Cancel" onClick={closeModal} style="ml-auto"/>
                <Button text="Save Question" onClick={() => handleSave()} filled disabled={!question}/>
            </div>
        </div>
    )

    return (
        <div className="fixed flex justify-center items-center w-[100vw] h-[100vh] top-0 left-0 bg-white bg-opacity-50">
            <div className="flex flex-col w-1/2 bg-white p-12 rounded-xl text-lg shadow-xl">
                { !type ? 
                    questionType
                : type === "mc" ?
                    multipleChoice
                : type === "tf" ?
                    trueFalse
                : type === "sa" ?
                    shortAnswer
                : null }
            </div>
        </div>
    )
}