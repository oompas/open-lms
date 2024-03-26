"use client"
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { callApi } from "@/config/firebase";
import Button from "@/components/Button";
import AuthForm from "@/components/AuthForm";

export default function SignUpPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const signUp = async () => {
        try {
            const response = await callApi('createAccount')({
                email: email,
                password: password
            });
            if (response && response.data) {
                console.log("Account created successfully.");
                router.push('/');
            } else {
                console.error("Error creating account:", response);
            }
        } catch (error) {
            console.error("Error creating account:", error);
        }
    };

    return (
        <main className="flex h-[100vh] items-center justify-center">
            <div className="flex bg-white p-12 rounded-2xl shadow-custom">
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
                            showEmail={true}
                            showPassword={true}
                            showJustName={true}
                        />
                        <Button text="sign up" onClick={signUp} style="mt-4 ml-auto" icon="arrow" filled/>
                    </div>
                    <div>or</div>
                    <Button text="back to login" onClick={() => router.push('/')} style="border-[3px] border-red-800" filled={false}/>
                </div>
            </div>
        </main>
    );
}
