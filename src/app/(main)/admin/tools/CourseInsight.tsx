import Link from "next/link"

export default function CourseInsight({
    title,
    count,
    time,
    score,
    id
} : {
    title: string,
    count: number,
    time: number,
    score: number,
    id: number
}) {
    return (
        <Link
            className="cursor-pointer hover:opacity-60 duration-100"
            href={"/course/"+id}
        >
            <div className="text-2xl">{title}</div>
        </Link>
    )
}