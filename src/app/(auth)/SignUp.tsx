import AuthForm from "@/components/AuthForm.tsx";
import Button from "@/components/Button.tsx";
import { callAPI, signUp } from "@/helpers/supabase.ts";
import React, { useState } from "react";

export default function SignUp({ setIsSignIn }) {

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [showVerifyEmailPopup, setShowVerifyEmailPopup] = useState(false);

    const submitSignUp = async () => {
        const { data, error } = await signUp(email, password);
        if (error) {
            console.error(`Error signing up user: ${error}`);
        } else {
            callAPI('setup-account', { name: name, userId: data.user.id });
            setShowVerifyEmailPopup(true);
        }
    }

    const VerifyEmailPopup = () => {
        return (
            <div className="fixed flex justify-center items-center w-screen h-screen top-0 left-0 bg-gray-900 bg-opacity-50 z-50">
                <div className="bg-white p-8 rounded-lg shadow-lg">
                    <h2 className="text-2xl font-bold mb-4">Verify Your Email</h2>
                    <p className="text-lg mb-4">Thank you for creating an account! Please verify your email address before signing in.</p>
                    <Button text="Close" onClick={() => setShowVerifyEmailPopup(false)} />
                </div>
            </div>
        );
    };

    return (
        <>
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

            <div className="flex justify-between mt-6">
                <Button
                    text="Sign In"
                    onClick={() => setIsSignIn(true)}
                    style="border-[3px] border-red-800"
                    icon="arrow-back"
                    iconBefore
                />

                <Button
                    text="Sign Up"
                    onClick={() => submitSignUp()}
                    style=""
                    icon="arrow"
                    filled
                />
            </div>
            {showVerifyEmailPopup && <VerifyEmailPopup />}
        </>
    );
}
