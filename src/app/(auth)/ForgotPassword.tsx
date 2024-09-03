import TextField from "@/components/TextField.tsx";
import Button from "@/components/Button.tsx";
import { useState } from "react";

export default function ForgotPassword({ email, setEmail, setPageType }) {

    const [isSent, setIsSent] = useState(false);

    return (

        <div className="flex flex-col h-full w-3/5 space-y-4">
            <div className="border-2 p-6 rounded-2xl">
                <div className="text-2xl font-bold mb-4">Forgot Password?</div>
                <div className="flex flex-col space-y-4">
                    <div className="flex flex-col">
                        <p className="mb-1 text-md">Email</p>
                        <TextField text={email} onChange={setEmail}/>
                    </div>

                    {isSent && <div className="text-green-700">Password reset email was sent!</div>}

                    <div className="flex justify-between">
                        <Button
                            text="Sign In"
                            onClick={() => setPageType("signin")}
                            style="border-[3px] border-red-800 mt-2"
                            filled={false}
                        />
                        <Button
                            text="Send Reset Link"
                            onClick={() => {
                                console.log("TODO: implement password reset");
                            }}
                            filled={true}
                            icon="arrow"
                            style="mt-2"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
