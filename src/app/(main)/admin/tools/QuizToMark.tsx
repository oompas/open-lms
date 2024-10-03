import Link from "next/link"

export default function QuizToMark({
    title,
    date,
    learner,
    id
} : {
    title: string,
    date: string,
    learner: string,
    id: number
}) {
    return ( title === "_placeholder" ?
        <div className="flex flex-col flex-shrink-0 w-[24%] border-4 border-gray-300 p-4 rounded-2xl opacity-0" />
        :
        <Link
            className="flex flex-col flex-shrink-0 w-[24%] border-4 border-gray-300 p-4 rounded-2xl cursor-pointer hover:opacity-60 duration-100"
            href={`/admin/mark/${id}`}
        >
            <div className="text-ld font-bold">{title}</div>
            <div className="text-sm mb-2">{date}</div>
            <div className="text-md">{learner}</div>
        </Link>
    )
}