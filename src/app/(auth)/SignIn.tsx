import AuthForm from "@/components/AuthForm.tsx";
import Button from "@/components/Button.tsx";
import { signIn, supabaseClient } from "@/config/supabase.ts";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import TextField from "@/components/TextField.tsx";

export default function SignIn({ email, setEmail, setIsLogin }) {

    const router = useRouter();

    const [password, setPass] = useState("");
    const [error, setError] = useState(null);
    const [forgotPassword, setForgotPassword] = useState(false);

    const submitLogin = async () => {
        setError(null);

        const { error } = await signIn(email, password);
        if (error) {
            setError(error.code);
        } else {
            router.push('/home')
        }
    };

    const sendResetEmail = async () => {
        const { data, error } = await supabaseClient.auth.resetPasswordForEmail(email);

        if (!error) {
            setIsSent(true);
        }

        console.log(`Data: ${JSON.stringify(data, null, 4)}`);
        console.log(`Error: ${JSON.stringify(error, null, 4)}`);
    }

    const forgotPasswordPopup = () => {
        return (
            <div
                className="fixed flex justify-center items-center w-screen h-screen top-0 left-0 bg-gray-900 bg-opacity-50 z-50"
                onClick={(e) => {
                    if (e.target === e.currentTarget) {
                        setForgotPassword(false);
                    }
                }}
            >
                <div className="bg-white p-8 rounded-lg shadow-lg min-w-[60vh] min-h-[30vh]">
                    <h2 className="text-2xl font-bold mb-4">
                        Forgot your password?
                    </h2>

                    <p className="mb-1 text-md">Email</p>
                    <TextField
                        style="w-full"
                        text={email}
                        onChange={setEmail}
                        placeholder="john.smith@gmail.com"
                    />

                    <div className="flex justify-between mt-8">
                        <Button text="Close" onClick={() => setForgotPassword(false)}/>
                        <Button text="Send link" onClick={() => setForgotPassword(false)} icon="arrow" filled/>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="relative min-h-[41.2vh]">
                <div className="text-xl font-bold mb-4">Login</div>
                <AuthForm
                    email={email}
                    setEmail={setEmail}
                    password={password}
                    setPass={setPass}
                    showName={false}
                    onForgotPassword={() => setForgotPassword(true)}
                />
                {error && (
                    <p className="text-red-500 mt-2">
                        {error === "auth/invalid-credential" && "Invalid credentials. Please check your email and password."}
                        {error === "auth/invalid-email" && "Invalid email format. Please enter a valid email address."}
                        {error === "auth/user-not-found" && "User not found. Please check your credentials or sign up."}
                        {error === "auth/wrong-password" && "Invalid password. Please enter your correct password."}
                        {error === "auth/internal-error" && "Email address not verified. Please check your inbox and verify your address."}
                        {error === "auth/missing-password" && "Missing password. Please enter a password."}
                    </p>
                )}

                <div className="absolute bottom-0 w-full">
                    <div className="flex justify-between mt-4">
                        <Button
                            text="Sign Up"
                            onClick={() => setIsLogin(false)}
                            style="border-[3px] border-red-800"
                            filled={false}
                        />
                        <Button
                            text="Login"
                            onClick={async () => await submitLogin()}
                            style="ml-4"
                            icon="arrow"
                            filled
                        />
                    </div>
                </div>
            </div>

            { forgotPassword && forgotPasswordPopup() }
        </>
    );
}
