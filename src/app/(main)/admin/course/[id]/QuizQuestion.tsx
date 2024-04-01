import { MdCheck, MdChevronLeft, MdChevronRight, MdDelete, MdEdit } from "react-icons/md"

export default function QuizQuestion({
    first,
    last,
    num,
    inData,
    editData,
    deleteData,
    moveUp,
    moveDown,
    preserveOrder
} : {
    first: boolean,
    last: boolean,
    num: number,
    inData: any,
    editData: any,
    deleteData: any,
    moveUp: any,
    moveDown: any,
    preserveOrder: boolean
}) {

    const letters = ["a)", "b)", "c)", "d)", "e)"];

    const data = { ...inData };
    if (inData.type === "tf") data["answers"] = ["True", "False"];

    return (
        <div className="flex flex-row p-6 border-2 rounded-xl text-lg">
            <div className="flex flex-col h-auto justify-between mr-4 -ml-2">
                { !first && preserveOrder && <button onClick={() => moveUp(num)}><MdChevronLeft size={28} className="rotate-90 text-red-800 hover:opacity-50"/></button> }
                { !last && preserveOrder && <button className="mt-auto" onClick={() => moveDown(num)}><MdChevronRight size={28} className="rotate-90 text-red-800 hover:opacity-50"/></button> }
            </div>
            <div className="flex flex-col w-full">
                <div className="flex flex-row items-center">
                    <div>
                        <b className="mr-1">Q{num})</b> {data.question}
                        <span className="text-xs text-gray-600 ml-2">({data.marks} marks)</span>
                    </div>
                    <button className="ml-auto text-red-800 hover:opacity-50" onClick={() => editData(num)}><MdEdit size={28}/></button>
                    <button className="ml-4 text-red-800 hover:opacity-50" onClick={() => deleteData(num)}><MdDelete size={28}/></button>
                </div>
                { data.type !== "sa" &&
                    <div className="flex flex-col mt-2 space-y-1">
                        { data.answers.map((answer: string, key: number) => (
                            <div className="flex flex-row items-center">
                                <div key={key} className="mr-1">{letters[key]} {answer}</div>
                                {data.correctAnswer === key && <MdCheck size={24} color="#47AD63"/>}
                            </div>
                        ))}
                    </div>
                }
            </div>
        </div>
    )
}
