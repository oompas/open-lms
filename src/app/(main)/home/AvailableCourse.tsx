import Link from "next/link"

export default function AvailableCourse({
    title,
    description,
    id,
    time
} : {
    title: string,
    description: string,
    id: number,
    time: any
}) {
    return (
        <Link
            className="relative border-4 w-[32%] border-gray-300 mb-8 p-6 rounded-2xl cursor-pointer hover:opacity-60 duration-100"
            href={`/course/${id}`}
        >
            <div className="text-2xl">{title}</div>
            <div className="mt-1 mb-8 text-lg">{description}</div>
            <div className="absolute bottom-4">{time}</div>
        </Link>
    )
}
