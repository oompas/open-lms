import Link from "next/link"

export default function LearnerInsight({
    learner,
    count,
    id
} : {
    learner: string,
    count: number,
    id: number
}) {
    return (
        <Link
            className="cursor-pointer hover:opacity-60 duration-100"
            href={"/course/"+id}
        >
            <div className="text-2xl">{learner}</div>
        </Link>
    )
}