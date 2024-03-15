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
            className="flex flex-col flex-shrink-0 w-[24%] border-4 border-gray-300 p-4 rounded-2xl cursor-pointer hover:opacity-60 duration-100"
            href={"/admin/mark/" + id}
        >
            <div className="text-lg font-bold">{title}</div>
            <div className="text-md">{learner}, {course}</div>
        </Link>
    )
}