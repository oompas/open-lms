import { MdCheck, MdChevronLeft, MdChevronRight, MdDelete, MdEdit } from "react-icons/md"

export default function QuizQuestion({
    first,
    last,
    num,
    data,       // { type: string, question: string, options: [a, b, c], answer: num (0-4) }
    editData,
    deleteData,
    moveUp,
    moveDown
} : {
    first: boolean,
    last: boolean,
    num: number,
    data: any,
    editData: any,
    deleteData: any,
    moveUp: any,
    moveDown: any
}) {

    const letters = ["a)", "b)", "c)", "d)", "e)"]

    return (
        <div className="flex flex-row p-6 border-2 rounded-xl text-lg">
            <div className="flex flex-col h-auto justify-between mr-4 -ml-2">
                { !first ? <button onClick={() => moveUp(num)}><MdChevronLeft size={28} className="rotate-90 text-red-800 hover:opacity-50"/></button> : null }
                { !last ? <button className="mt-auto" onClick={() => moveDown(num)}><MdChevronRight size={28} className="rotate-90 text-red-800 hover:opacity-50"/></button> : null }
            </div>
            <div className="flex flex-col w-full">
                <div className="flex flex-row items-center">
                    <div><b>Q{num}.</b> {data.question}</div>
                    <button className="ml-auto text-red-800 hover:opacity-50" onClick={() => editData(num)}><MdEdit size={28}/></button>
                    <button className="ml-4 text-red-800 hover:opacity-50" onClick={() => deleteData(num)}><MdDelete size={28}/></button>
                </div>
                { data.answers.length > 0 ? <div className="flex flex-col mt-2 space-y-1">
                    { data.answers.map((answer: string, key: number) => (
                        <div className="flex flex-row items-center">
                            <div key={key} className="mr-1">{letters[key]} {answer}</div>
                            { data.correctAnswer === key ? <MdCheck size={24} color="#47AD63"/> : null }
                        </div>
                    ))}
                </div> : null }
            </div>
        </div>
    )
}