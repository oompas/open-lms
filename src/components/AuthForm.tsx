import TextField from "./TextField";

export default function AuthForm({
    email,
    setEmail,
    password,
    setPass,
} : {
    email: string,
    setEmail: any,
    password: string,
    setPass: any
}) {
    return (
        <div className="flex flex-col space-y-4">
            <div className="flex flex-col">
                <p className="mb-4 text-lg">Email</p>
                <TextField text={email} onChange={setEmail} placeholder="john@doe.com" hidden={false}/>
            </div>
            <div className="flex flex-col">
                <p className="mb-4 text-lg">Password</p>
                <TextField text={password} onChange={setPass} placeholder="******" hidden={true}/>
                <p className="mt-2 text-gray-500 cursor-pointer">forgot your password?</p>
            </div>
        </div>
    )
}