import TextField from "./TextField";
import Button from "./Button";

export default function AuthForm({
} : {
}) {
    return (
        <div className="flex flex-col space-y-4">
            <div className="flex flex-col">
                <p className="mb-4 text-lg">Email</p>
                <TextField text="email@gmail.com"/>
            </div>
            <div className="flex flex-col">
                <p className="mb-4 text-lg">Password</p>
                <TextField text="12345"/>
                <p className="mt-2 text-gray-500">forgot your password?</p>
            </div>
        </div>
    )
}