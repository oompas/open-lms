import AuthForm from "@/components/AuthForm.tsx";
import Button from "@/components/Button.tsx";
import { signIn, supabaseClient } from "@/helpers/supabase.ts";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import TextField from "@/components/TextField.tsx";

export default function SignIn({ setIsSignIn }) {

    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPass] = useState("");
    const [error, setError] = useState(null);

    const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
    const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");

    const submitSignIn = async () => {
        setError(null);

        const { error } = await signIn(email, password);
        if (error) {
            setError(error.code);
        } else {
            router.push('/home')
        }
    };

    const sendResetEmail = async () => {

        const site = process.env.NEXT_PUBLIC_SUPABASE_REDIRECT_URL || "https://www.open-lms.ca";

        const { data, error } = await supabaseClient.auth
            .resetPasswordForEmail(forgotPasswordEmail, { redirectTo: site + '/resetPassword' });

        if (!error) {
            console.log(`Sent forgot password! Data: ${JSON.stringify(data, null, 4)}`);
            setForgotPasswordOpen(false);
        } else {
            console.log(`Error sending forgot password: ${JSON.stringify(error, null, 4)}`);
        }
    }

    const forgotPasswordPopup = () => {
        return (
            <div
                className="fixed flex justify-center items-center w-screen h-screen top-0 left-0 bg-gray-900 bg-opacity-50 z-50"
                onClick={(e) => {
                    if (e.target === e.currentTarget) {
                        setForgotPasswordOpen(false);
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
                        text={forgotPasswordEmail}
                        onChange={setForgotPasswordEmail}
                        placeholder="john.smith@gmail.com"
                    />

                    <div className="flex justify-between mt-8">
                        <Button text="Close" onClick={() => setForgotPasswordOpen(false)}/>
                        <Button text="Send link" onClick={async () => await sendResetEmail()} icon="arrow" filled/>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="">
                <div className="text-xl font-bold mb-4">Sign In</div>
                <AuthForm
                    email={email}
                    setEmail={setEmail}
                    password={password}
                    setPass={setPass}
                    showName={false}
                    onForgotPassword={() => setForgotPasswordOpen(true)}
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

                <div className="">
                    <div className="flex justify-between mt-4">
                        <Button
                            text="Sign Up"
                            onClick={() => setIsSignIn(false)}
                            style="border-[3px] border-red-800"
                            filled={false}
                        />
                        <Button
                            text="Sign In"
                            onClick={async () => await submitSignIn()}
                            style="ml-4"
                            icon="arrow"
                            filled
                        />
                    </div>
                </div>
            </div>

            { forgotPasswordOpen && forgotPasswordPopup() }
        </>
    );
}
