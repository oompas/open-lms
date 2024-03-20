import Link from "next/link"

export default function Notifications({
    title,
    description,
    urgency,
    link,
    id
} : {
    title: string
    description: string
    urgency: string
    link: string
    id: number
}) {
    return (
        <div className="flex flex-col h-[60vh] bg-[#9D1939] text-white p-10 ml-10 rounded-2xl shadow-custom mb-8">
            <div className="text-2xl mb-10">Notifications Centre</div>
        </div>
            
    )
}