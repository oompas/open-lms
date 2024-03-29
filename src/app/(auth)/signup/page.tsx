"use client"
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ApiEndpoints, callApi } from "@/config/firebase";
import Button from "@/components/Button";
import AuthForm from "@/components/AuthForm";
import VerifyEmailPopup from "@/app/(auth)/signup/VerifyEmail";

export default function SignUpPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isInvalidName, setInvalidName] = useState(false);
    const [isInvalidEmail, setInvalidEmail] = useState(false);
    const [isInvalidPass, setInvalidPass] = useState(false);
    const [showVerifyEmailPopup, setShowVerifyEmailPopup] = useState(false);
    const [redirectAfterPopupClosed, setRedirectAfterPopupClosed] = useState(false);

    const signUp = async () => {
        setInvalidPass(false);
        setInvalidName(false);
        setInvalidEmail(false);
        const hasUpperCase = /[A-Z]/;
        const hasLowerCase = /[a-z]/;
        const hasNumbers = /[0-9]/;
        const hasSpecialChars = /[!#$%&@?]/;

        if (!(hasUpperCase.test(password) && hasLowerCase.test(password) && hasNumbers.test(password) && hasSpecialChars.test(password) && password.length >= 10)) {
            console.error("Password must be at least ten characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character");
            setInvalidPass(true);
            return;
        }

        if (name.length < 1) {
            console.error("Name must be at least one character long.");
            setInvalidName(true);
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            console.error("Invalid email format.");
            setInvalidEmail(true);
            return;
        }

        try {
            const response = await callApi(ApiEndpoints.CreateAccount, {
                name: name,
                email: email,
                password: password
            });
            if (response && response.data) {
                console.log("Account created successfully.");
                setShowVerifyEmailPopup(true);
            } else {
                console.error("Error creating account:", response);
            }
        } catch (error) {
            console.error("Error creating account:", error);
        }
    };

    const handlePopupClose = () => {
        setShowVerifyEmailPopup(false);
        setRedirectAfterPopupClosed(true);
    };

    useEffect(() => {
        if (redirectAfterPopupClosed) {
            router.push('/');
        }
    }, [redirectAfterPopupClosed, router]);

    return (
        <main className="flex h-[100vh] items-center justify-center">
            <div className="flex bg-white w-1/3 p-12 rounded-2xl shadow-custom">
                <div className="flex flex-col h-full w-full space-y-4">
                    <div className="border-2 p-6 rounded-2xl">
                        <div className="text-xl font-bold mb-4">Sign up with email</div>
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
                        {isInvalidName && (
                            <p className="text-red-500 mt-2" style={{ maxWidth: "300px" }}>
                                Name must be at least one character long.
                            </p>
                        )}
                        {isInvalidEmail && (
                            <p className="text-red-500 mt-2" style={{ maxWidth: "300px" }}>
                                Invalid email format.
                            </p>
                        )}
                        {isInvalidPass && (
                            <p className="text-red-500 mt-2" style={{ maxWidth: "300px" }}>
                                Password must be at least ten characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character.
                            </p>
                        )}
                        <Button text="Sign Up" onClick={signUp} style="mt-4 ml-auto" icon="arrow" filled/>
                    </div>
                    <div>or</div>
                    <Button text="Back to Log In" onClick={() => router.push('/')} style="border-[3px] border-red-800" filled={false}/>
                </div>
            </div>
            {showVerifyEmailPopup && <VerifyEmailPopup onClose={handlePopupClose} />}
        </main>
    );
}
