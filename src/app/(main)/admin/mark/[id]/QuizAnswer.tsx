import Requirement from "@/app/(main)/course/[id]/Requirement";

export default function QuizAnswer({
    question,
    answer,
    id
} : {
    question: string,
    answer: string,
    id: number
}) {
    return (
        <div className="flex mt-4">
            <div className="bg-white w-full p-16 rounded-2xl shadow-custom">
                <div className="text-2xl mb-2">Q{id}: {question}</div>
                <div className="text-2xl mb-8">A: {answer}</div>
                {/* TODO - replace this */}
                <Requirement key={1} text={"Check if correct"} done={false}/>
            </div>
        </div>
    )
}