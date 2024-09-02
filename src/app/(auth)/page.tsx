"use client"
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from "@/components/Button";
import AuthForm from '@/components/AuthForm';
import { signIn } from "@/config/supabase.ts";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export default function AuthPage() {

    const router: AppRouterInstance = useRouter();

    const [email, setEmail] = useState("")
    const [password, setPass] = useState("")
    const [error, setError] = useState(null);

    const submitLogin = async () => {
        setError(null);
        // await signInWithEmailAndPassword(auth, email, password)
        //     .then(() => router.push('/home'))
        //     .catch((error: any) => setError(error.code));

        const { data, error } = await signIn(email, password);
        if (error) {
            setError(error.code);
        } else {
            router.push('/home')
        }
        console.log(JSON.stringify(data, null, 4));
    };

    return (
        <main className="flex h-[100vh] items-center justify-center">
            <div className="flex max-w-[1000px] bg-white p-12 rounded-2xl shadow-custom">
                <div className="flex flex-col h-full w-3/5 space-y-4">
                    <div className="border-2 p-6 rounded-2xl">
                        <div className="text-xl font-bold mb-4">Login</div>
                        <AuthForm
                            email={email}
                            setEmail={setEmail}
                            password={password}
                            setPass={setPass}
                            showName={false}
                            onForgotPassword={() => router.push('/forgotpassword')}
                        />
                        <div className="flex justify-between mt-4">
                            <Button text="Sign Up" onClick={() => router.push('/signup')}
                                    style="border-[3px] border-red-800" filled={false}/>
                            <Button text="Login" onClick={async () => await submitLogin()} style="ml-4" icon="arrow"
                                    filled/>
                        </div>
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
                    </div>
                </div>
                <div className="flex-col h-full w-2/5 ml-10 space-y-4">
                    <div className="text-2xl">Welcome to <b>OpenLMS</b></div>
                    <div>OpenLMS is a generic open-source education platform. Login with your account to get started.</div>
                    <div>Created at Queen’s University in Kingston Ontario, Canada.</div>
                    <img
                        src="/openlms.png"
                        alt="OpenLMS Logo" 
                        className="w-1/2 mx-auto"
                    />
                </div>
            </div>
        </main>
    )
}