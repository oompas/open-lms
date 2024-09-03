import AuthForm from "@/components/AuthForm.tsx";
import Button from "@/components/Button.tsx";
import { callAPI } from "@/config/supabase.ts";
import { useState } from "react";

export default function SignUp({ email, setEmail, setPageType }) {

    const [name, setName] = useState("");
    const [password, setPassword] = useState("");

    const signUp = async () => {
        await callAPI('create-account', { email, password, name });
    }

    return (
        <div className="flex flex-col h-full w-3/5 space-y-4">
            <div className="border-2 p-6 rounded-2xl">
                <div className="text-xl font-bold mb-4">Create Account</div>
                <AuthForm
                    email={email}
                    setEmail={setEmail}
                    password={password}
                    setPass={setPassword}
                    name={name}
                    setName={setName}
                    showName={true}
                    isSignUpPage={true}
                />
                {/*{isInvalidName && (*/}
                {/*    <p className="text-red-500 mt-2" style={{maxWidth: "300px"}}>*/}
                {/*        Name must be at least one character long.*/}
                {/*    </p>*/}
                {/*)}*/}
                {/*{isInvalidEmail && (*/}
                {/*    <p className="text-red-500 mt-2" style={{maxWidth: "300px"}}>*/}
                {/*        Invalid email format.*/}
                {/*    </p>*/}
                {/*)}*/}
                {/*{isInvalidPass && (*/}
                {/*    <p className="text-red-500 mt-2" style={{maxWidth: "300px"}}>*/}
                {/*        Password must be at least ten characters long, contain at least one uppercase letter, one*/}
                {/*        lowercase letter, one number, and one special character.*/}
                {/*    </p>*/}
                {/*)}*/}
                <Button text="Sign Up" onClick={signUp} style="mt-4 ml-auto" icon="arrow" filled/>
                <Button text="Back to Login" onClick={() => setPageType('signin')} style="border-[3px] border-red-800"
                        filled={false}/>
            </div>
        </div>
    );
}
