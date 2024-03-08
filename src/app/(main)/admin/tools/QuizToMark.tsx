import Link from "next/link"

export default function QuizToMark({
    title,
    course,
    learner,
    id
} : {
    title: string,
    course: string,
    learner: string,
    id: number
}) {
    return (
        <Link
            className="flex-shrink-0 w-1/5 mr-4 border-4 border-gray-300 mb-4 p-4 rounded-2xl cursor-pointer hover:opacity-60 duration-100"
            href={"/admin/mark/" + id}
        >
            <div className="text-2xl font-bold">{title}</div>
            <div className="mt-1 text-lg">{learner}, {course}</div>
        </Link>
    )
}