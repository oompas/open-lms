import Button from "@/components/Button"

export default function IDProfile({
    name,
    dateMonth,
    dateDay,
    dateYear,
    email,
    link,
    id
} : {
    name: string,
    dateMonth: string,
    dateDay: string,
    dateYear: string,
    email: string,
    link: string,
    id: number
}) {
    return (
        <div className="h-full">
            <div className="text-2xl font-bold">{name}</div>
            <div className="flex flex-col items-end">
                <div className="mr-auto text-lg mb-4">joined {dateMonth} {dateDay}, {dateYear}</div>
                <div className="mr-auto text-lg">{email}</div>
            </div>
            {/* TODO - implement */}
            <Button text="Remove user from platform" style="mt-8" onClick={() => alert("remove")} />
        </div>
    )
    }
