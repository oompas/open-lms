"use client"
import { useEffect, useState } from 'react';
import SignIn from "@/app/(auth)/SignIn.tsx";
import ForgotPassword from "@/app/(auth)/ForgotPassword.tsx";
import SignUp from "@/app/(auth)/SignUp.tsx";
import { supabaseClient } from "@/config/supabase.ts";

export default function AuthPage() {

    const [pageType, setPageType] = useState<"signin" | "signup" | "forgot-password">("signin");
    const [email, setEmail] = useState("");

    useEffect(() => {
        supabaseClient.auth.onAuthStateChange(async (event, session) => {
            if (event == "PASSWORD_RECOVERY") {
                const newPassword = prompt("What would you like your new password to be?");
                const { data, error } = await supabaseClient.auth.updateUser({ password: newPassword })

                if (data) alert("Password updated successfully!")
                if (error) alert("There was an error updating your password.")
            }
        })
    }, [])

    const renderComponent = () => {
        switch (pageType) {
            case "signin":
                return (
                    <SignIn
                        email={email}
                        setEmail={setEmail}
                        setPageType={setPageType}
                    />
                );
            case "signup":
                return (
                    <SignUp
                        email={email}
                        setEmail={setEmail}
                        setPageType={setPageType}
                    />
                );
            case "forgot-password":
                return (
                    <ForgotPassword
                        email={email}
                        setEmail={setEmail}
                        setPageType={setPageType}
                    />
                );
            default:
                throw new Error(`Invalid page type: ${pageType}`);
        }
    }

    return (
        <main className="flex h-[100vh] items-center justify-center">
            <div className="flex max-w-[1000px] bg-white p-12 rounded-2xl shadow-custom">

                {renderComponent()}

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