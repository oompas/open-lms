import Link from "next/link"
import { LuExternalLink } from "react-icons/lu"

export default function CourseInsight({
    courseData
} : {
    courseData: {
        courseId: string,
        name: string,
        numEnrolled: number,
        numComplete: number,
        avgTime: number,
        avgQuizScore: number

    }
}) {
    return (
        <tr key={courseData.courseId} className="border">
            <td className="border p-2">
                <Link href={"/admin/course/"+courseData.courseId} className="flex flex-row items-center hover:opacity-60">
                    {courseData.name}
                    <LuExternalLink className="ml-1" color="rgb(153 27 27" />
                </Link>
            </td>
            <td className="border p-2">
                {!courseData.numEnrolled ? "-" : courseData.numComplete + "/" + courseData.numEnrolled}
            </td>
            <td className="border p-2">
                {!courseData.avgTime ? "-" : courseData.avgTime + " minutes"}
            </td>
            <td className="border p-2">
                {!courseData.avgQuizScore ? "-" : courseData.avgQuizScore + "%"}
            </td>
        </tr>
    )
}