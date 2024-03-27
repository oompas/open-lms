import Button from "@/components/Button"

export default function IDProfile({
    name,
    signUpDate,
    lastLoginDate,
    email
} : {
    name: string,
    signUpDate: number,
    lastLoginDate: number,
    email: string,
}) {
    return (
        <div className="flex flex-col h-full">
            <div className="text-2xl font-bold mt-2">{name}</div>
            <div className="flex flex-col h-full items-end mb-auto">
                <div className="mr-auto text-lg mb-4">{email}</div>
                <div className="mr-auto text-lg">Joined: <i>{signUpDate}</i></div>
                <div className="mr-auto text-lg mb-4">Last active: <i>{lastLoginDate}</i></div>
            </div>
            {/* TODO - implement */}
            <Button text="Remove user from platform" onClick={() => alert("remove")} />
        </div>
    )
    }
