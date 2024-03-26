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
        <div className="h-full">
            <div className="text-2xl font-bold">{name}</div>
            <div className="flex flex-col items-end">
                <div className="mr-auto text-lg mb-4">Joined: <i>{signUpDate}</i></div>
                <div className="mr-auto text-lg mb-4">Last login: <i>{lastLoginDate}</i></div>
                <div className="mr-auto text-lg">{email}</div>
            </div>
            {/* TODO - implement */}
            <Button text="Remove user from platform" style="mt-8" onClick={() => alert("remove")} />
        </div>
    )
    }
