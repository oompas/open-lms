export default function IDEnrolled({
    title,
    completionDate,
    id
} : {
    title: string,
    completionDate: string,
    id?: number
}) {
    return (
        <tr className="border">
            <td className="border p-2">
                {title}
            </td>
            <td className="border p-2">{completionDate}</td>
        </tr>
            
    )
}


