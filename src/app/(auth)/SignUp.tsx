import AuthForm from "@/components/AuthForm.tsx";
import Button from "@/components/Button.tsx";
import { callAPI } from "@/config/supabase.ts";
import React, { useState } from "react";

export default function SignUp({ email, setEmail, setPageType }) {

    const [name, setName] = useState("");
    const [password, setPassword] = useState("");

    const [showVerifyEmailPopup, setShowVerifyEmailPopup] = useState(false);

    const signUp = () => {
        console.log(`Email: ${email}, Password: ${password}, Name: ${name}`);
        callAPI('create-account', { email, password, name }, false)
            .then((r) => {
                if (!r.error) {
                    setShowVerifyEmailPopup(true);
                }
            });
    }

    const VerifyEmailPopup = () => {
        return (
            <div className="fixed flex justify-center items-center w-screen h-screen top-0 left-0 bg-gray-900 bg-opacity-50 z-50">
                <div className="bg-white p-8 rounded-lg shadow-lg">
                    <h2 className="text-2xl font-bold mb-4">Verify Your Email</h2>
                    <p className="text-lg mb-4">Thank you for creating an account! Please verify your email address before logging in.</p>
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

            <div className="flex justify-between mt-6">
                <Button
                    text="Back to Login"
                    onClick={() => setPageType('signin')}
                    style="border-[3px] border-red-800"
                    filled={false}
                />

                <Button
                    text="Sign Up"
                    onClick={() => signUp()}
                    style=""
                    icon="arrow"
                    filled
                />
            </div>
            {showVerifyEmailPopup && <VerifyEmailPopup />}
        </>
    );
}
