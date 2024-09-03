import AuthForm from "@/components/AuthForm.tsx";
import Button from "@/components/Button.tsx";
import { signIn } from "@/config/supabase.ts";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignIn({ email, setEmail, setPageType }) {

    const router = useRouter();

    const [password, setPass] = useState("");
    const [error, setError] = useState(null);

    const submitLogin = async () => {
        setError(null);

        const { error } = await signIn(email, password);
        if (error) {
            setError(error.code);
        } else {
            router.push('/home')
        }
    };

    return (
        <div className="relative min-h-[41.2vh]">
            <div className="text-xl font-bold mb-4">Login</div>
            <AuthForm
                email={email}
                setEmail={setEmail}
                password={password}
                setPass={setPass}
                showName={false}
                onForgotPassword={() => setPageType("forgot-password")}
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

            <div className="absolute bottom-0 w-full">
                <div className="flex justify-between mt-4">
                    <Button
                        text="Sign Up"
                        onClick={() => setPageType("signup")}
                        style="border-[3px] border-red-800"
                        filled={false}
                    />
                    <Button
                        text="Login"
                        onClick={async () => await submitLogin()}
                        style="ml-4"
                        icon="arrow"
                        filled
                    />
                </div>
            </div>
        </div>
    );
}
