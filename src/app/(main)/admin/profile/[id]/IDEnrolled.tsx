export default function IDCoursesEnrolled({
    title,
    completionDate,
    link,
    id
} : {
    title: string
    completionDate: string
    link: string
    id: number
}) {
    return (
            <div className="flex flex-col mr-auto text-lg w-[100%]">
                <table className="flex-col border-collapse border w-full">
                    <tbody>
                        <tr className="border">
                                <td className="border p-2">
                                    {title}
                                </td>
                                <td className="border p-2">{completionDate}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
    )
}


