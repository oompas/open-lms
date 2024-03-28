import TextField from "./TextField";

export default function AuthForm({
   email,
   setEmail,
   password,
   setPass,
   name,
   setName,
   showName,
   onForgotPassword
} : {
    email: string,
    setEmail: any,
    password: string,
    setPass: any,
    name?: string,
    setName?: any,
    showName: boolean,
    onForgotPassword?: any
}) {
    return (
        <div className="flex flex-col space-y-4">
            {showName && (
                <div className="flex flex-col">
                    <p className="mb-1 text-md">Name</p>
                    <TextField text={name || ""} onChange={setName} placeholder="John" hidden={false}/>
                </div>
            )}
            <div className="flex flex-col">
                <p className="mb-1 text-md">Email</p>
                <TextField text={email} onChange={setEmail} placeholder="john@doe.com" hidden={false}/>
            </div>
            <div className="flex flex-col">
                <p className="mb-1 text-md">Password</p>
                <TextField text={password} onChange={setPass} placeholder="******" hidden={true}/>
                {onForgotPassword && (
                    <p className="mt-2 text-gray-500 cursor-pointer" onClick={onForgotPassword}>Forgot your
                        password?</p>
                )}
            </div>
        </div>
    )
}