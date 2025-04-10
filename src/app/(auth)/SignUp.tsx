import { useState, useEffect } from 'react';
import { callAPI, signUp } from "@/helpers/supabase.ts";
import Button from "@/components/Button.tsx";
import TextField from "@/components/TextField.tsx";
import { validateEmailAndLength, validatePassword } from "@/components/TextField";

export default function SignUp({ setIsSignIn }) {

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showVerifyEmailPopup, setShowVerifyEmailPopup] = useState(false);

    const [emailValidationMessage, setEmailValidationMessage] = useState("");
    const [passwordValidationMessages, setPasswordValidationMessages] = useState<string[]>([]);

    const handleEmailChange = (newEmail: string) => {
        setEmail(newEmail);
        setEmailValidationMessage(validateEmailAndLength(newEmail));
    };

    const handlePasswordChange = (newPass: string) => {
        setPassword(newPass);
        setPasswordValidationMessages(validatePassword(newPass));
    };

    useEffect(() => {
        setPasswordValidationMessages(validatePassword(password));
    }, []);

    const submitSignUp = async () => {
        if (password.length < 10 || passwordValidationMessages.length > 0) {
            setPasswordValidationMessages([...passwordValidationMessages, "Password must be at least 10 characters long and meet all requirements."]);
            return;
        }

        const { data, error } = await signUp(email, password);
        if (error) {
            console.error("Error signing up:", error.message);
        } else {
            console.log("User signed up:", data);
            callAPI('setup-account', { name: name, userId: data.user.id });
            setShowVerifyEmailPopup(true);
        }
    };

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
            <div className="flex flex-col space-y-4">
                <div className="flex flex-col">
                    <p className="mb-1 text-md">Name</p>
                    <TextField text={name || ""} onChange={setName} placeholder="John Doe" hidden={false} />
                </div>
                <div className="flex flex-col">
                    <p className="mb-1 text-md">Email</p>
                    <TextField text={email} onChange={handleEmailChange} placeholder="name@email.com" hidden={false} />
                    {emailValidationMessage && <p className="mt-1 text-sm text-red-500">{emailValidationMessage}</p>}
                </div>
                <div className="flex flex-col relative">
                    <p className="mb-1 text-md">Password</p>
                    <TextField text={password} onChange={handlePasswordChange} placeholder="**********" hidden={true} />
                    {passwordValidationMessages.length > 0 && (
                        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 text-red-500">
                            <span className="cursor-pointer" title={passwordValidationMessages.join("\n")}>⚠️</span>
                        </div>
                    )}
                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2 text-gray-500 cursor-pointer" title="Password must be at least 10 characters long, include uppercase, lowercase, numbers, and special characters.">
                        <span>ℹ️</span>
                    </div>
                    {passwordValidationMessages.map((msg, idx) => (
                        <p key={idx} className="mt-1 text-sm text-red-500">{msg}</p>
                    ))}
                </div>
            </div>
            <div className="flex justify-between mt-6">
                <Button text="Sign In" onClick={() => setIsSignIn(true)} style="border-[3px] border-red-800" icon="arrow-back" iconBefore />
                <Button text="Sign Up" onClick={() => submitSignUp()} style="" icon="arrow" filled />
            </div>
            {showVerifyEmailPopup && <VerifyEmailPopup />}
        </>
    );
}