"use client"
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiEndpoints, callApi } from "@/config/firebase";
import Button from "@/components/Button";
import TextField from '@/components/TextField';

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [isSent, setIsSent] = useState(false);

    const sendResetEmail = async () => {
        try {
            const response = await callApi(ApiEndpoints.ResetPassword, { email: email });
            if (response && response.data) {
                setIsSent(true);
            } else {
                console.error("An error occurred while sending the reset email.");
            }
        } catch (error) {
            console.error("Error sending reset email:", error);
        }
    };

    return (
        <main className="flex h-[100vh] items-center justify-center">
            <div className="flex flex-col bg-white p-12 rounded-2xl shadow-custom">
                <div className="text-2xl font-bold mb-4">Forgot password?</div>
                <div className="flex flex-col space-y-4">
                    <div className="flex flex-col mb-2">
                        <p className="mb-1 text-md">Account Email</p>
                        <TextField text={email} onChange={setEmail} />
                    </div>
                    <Button text="Send Reset Email" onClick={sendResetEmail} filled={true} style="mt-6"/>
                    {isSent && <p>Password reset email was sent.</p>}
                    <Button text="Back to Login" onClick={() => router.push('/')} style="border-[3px] border-red-800 mt-4" filled={false}/>
                </div>
            </div>
        </main>
    );
}