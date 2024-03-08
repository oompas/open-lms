import TextField from "@/components/TextField"
import { MdCheck, MdDelete, MdEdit } from "react-icons/md"

export default function QuizQuestion({
    num,
    data,       // { type: string, question: string, options: [a, b, c], answer: num (0-4) }
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
            { data.options.length > 0 ? <div className="flex flex-col mt-2 space-y-1">
                { data.options.map((answer: string, key: number) => (
                    <div className="flex flex-row items-center">
                        <div key={key} className="mr-1">{letters[key]} {answer}</div>
                        { data.answer === key ? <MdCheck size={24} color="#47AD63"/> : null }
                    </div>
                ))}
            </div> : null }
        </div>
    )
}