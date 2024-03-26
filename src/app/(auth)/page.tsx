"use client"
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import '@/config/firebase';
import Button from "@/components/Button";
import AuthForm from '@/components/AuthForm';
import AuthButton from './AuthButton';
import { auth } from "@/config/firebase";
import { signInWithEmailAndPassword } from "@firebase/auth";
import { redirect } from "next/navigation";

export default function AuthPage() {

    console.log(`Auth current user: ${auth.currentUser}`);
    if (auth.currentUser) {
        redirect('/home');
    }

    const router = useRouter()
    const [email, setEmail] = useState("")
    const [password, setPass] = useState("")

    // function called on "log in" button press
    const submitLogin = async () => {
        await signInWithEmailAndPassword(auth, email, password)
            .then(() => console.log("Signed in!"))
            .catch((err) => console.log(`Error signing in: ${err}`));

        router.push('/home');
    }

    const handleForgotPassword = () => {
        router.push('/forgotpassword');
    };

    return (
        <main className="flex h-[100vh] items-center justify-center">
            <div className="flex max-w-[1000px] bg-white p-12 rounded-2xl shadow-custom">
                <div className="flex flex-col h-full w-3/5 space-y-4">
                    <div className="border-2 p-6 rounded-2xl">
                        <div className="text-xl font-bold mb-4">Log in with email</div>
                        <AuthForm
                            email={email}
                            setEmail={setEmail}
                            password={password}
                            setPass={setPass}
                            showName={false}
                            showEmail={true}
                            showPassword={true}
                            showJustName={false}
                            onForgotPassword={handleForgotPassword}
                        />
                        <div className="flex justify-between mt-4">
                            <Button text="sign up" onClick={() => router.push('/signup')}
                                    style="border-[3px] border-red-800" filled={false}/>
                            <Button text="log in" onClick={async () => await submitLogin()} style="ml-4" icon="arrow"
                                    filled/>
                        </div>
                    </div>
                    <div>or</div>
                    <AuthButton text={"continue with Google"} icon="google" onClick={() => router.push('/home')}/>
                    <AuthButton text={"continue with another SSO"} icon="sso" onClick={() => router.push('/home')}/>
                </div>
                <div className="flex-col h-full w-2/5 ml-10 space-y-4">
                    <div className="text-2xl">Welcome to <b>OpenLMS</b></div>
                    <div>OpenLMS is a generic open-source education platform. Log in with your account to get started.</div>
                    <div>Created at Queen’s University in Kingston Ontario.</div>
                </div>
            </div>
        </main>
    )
}