"use client"
import { useState } from 'react';
import SignIn from "@/app/(auth)/SignIn.tsx";
import SignUp from "@/app/(auth)/SignUp.tsx";

export default function AuthPage() {

    const [isSignIn, setIsSignIn] = useState<boolean>(true);

    const renderComponent = () => {
        if (isSignIn) {
            return <SignIn setIsSignIn={setIsSignIn}/>;
        }
        return <SignUp setIsSignIn={setIsSignIn}/>;
    }

    return (
        <main className="flex h-[100vh] items-center justify-center">
            <div className="flex max-w-[1000px] bg-white p-12 rounded-2xl shadow-custom">

                <div className="flex flex-col h-full w-3/5 space-y-4">
                    <div className="min-h-[45vh] border-2 p-6 rounded-2xl">
                        {renderComponent()}
                    </div>
                </div>

                <div className="flex-col h-full w-2/5 ml-10 space-y-5">
                    <div className="text-2xl">Welcome to <b>OpenLMS</b></div>
                    <div>OpenLMS is a generic open-source education platform. Sign in with your account to get started.</div>
                    <div>Created at Queen’s University in Kingston Ontario, Canada.</div>
                    <img
                        src="/openlms.png"
                        alt="OpenLMS Logo"
                        className="w-1/2 mx-auto py-4"
                    />
                </div>
            </div>
        </main>
    )
}