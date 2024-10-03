export default function IDCompleted({
    title,
    completionTime,
    id
} : {
    title: string,
    completionTime: string,
    id?: number
}) {
    return (
        <tr className="border">
            <td className="border p-2">
                {title}
            </td>
            <td className="border p-2">{completionTime}</td>
        </tr>
    );
}
