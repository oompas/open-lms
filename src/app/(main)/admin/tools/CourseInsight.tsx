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
            <td className="border p-2">{courseData.name}</td>
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