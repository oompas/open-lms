import Link from "next/link"

export default function CompletedCourse({
    title,
    date,
    id
} : {
    title: string,
    date: number,
    id: number
}) {
    return (
        <Link 
            className="border-4 mb-4 p-4 rounded-2xl cursor-pointer hover:opacity-60 duration-100"
            style={{borderColor: "#47AD63"}}
            href={`/course/${id}`}
        >
            <div className="text-2xl">{title}</div>
            <div className="mt-1 text-lg">Completed {new Date(date).toLocaleString()}</div>
        </Link>
    )
}