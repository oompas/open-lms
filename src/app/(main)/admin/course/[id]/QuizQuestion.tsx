import TextField from "@/components/TextField"
import { MdDelete, MdEdit } from "react-icons/md"

export default function QuizQuestion({
    num,
    data,       // { question: string, answers: [a, b, c] }
    editData,
    deleteData
} : {
    num: number,
    data: any,
    editData: any,
    deleteData: any
}) {

    const letters = ["a)", "b)", "c)", "d)", "e)"]

    return (
        <div className="flex flex-col p-6 border-2 rounded-xl text-lg">
            <div className="flex flex-row items-center">
                <div><b>Q{num}.</b> {data.question}</div>
                <button className="ml-auto text-red-800" onClick={() => editData(num)}><MdEdit size={28}/></button>
                <button className="ml-4 text-red-800" onClick={() => deleteData(num)}><MdDelete size={28}/></button>
            </div>
            <div className="flex flex-col mt-2 space-y-1">
                { data.answers.map((answer: string, key: number) => (
                    <div key={key}>{letters[key]} {answer}</div>
                ))}
            </div>
        </div>
    )
}