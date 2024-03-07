export default function LearnerInsight({
    name,
    email,
    coursesEnrolled,
    coursesAttempted,
    coursesCompleted,
    id
} : {
    name: string,
    email: string,
    coursesEnrolled: number,
    coursesAttempted: number,
    coursesCompleted: number,
    id: number
}) {
    return (
        <tr key={id} className="border">
            <td className="border p-2">{name}</td>
            <td className="border p-2">{email}</td>
            <td className="border p-2">{coursesEnrolled}</td>
            <td className="border p-2">{coursesAttempted}</td>
            <td className="border p-2">{coursesCompleted}</td>
        </tr>
    );
}