import Link from "next/link"

export default function CompletedCourse({
    title,
    date,
    id
} : {
    title: string,
    date: string,
    id: number
}) {
    return (
        <Link 
            className="border-4 border-gray-300 mb-4 p-4 rounded-2xl cursor-pointer hover:opacity-60 duration-100" 
            href={"/course/"+id}
        >
            <div className="text-2xl">{title}</div>
            <div className="mt-1 text-lg">{date}</div>
        </Link>
    )
}