import { useState } from 'react';
import { useRouter } from "next/navigation";
import { signIn, supabaseClient } from "@/helpers/supabase.ts";
import Button from "@/components/Button.tsx";
import TextField from "@/components/TextField.tsx";
import { validateEmailAndLength, validatePassword } from "@/components/TextField";
import { FiAlertCircle } from 'react-icons/fi';

export default function SignIn({ setIsSignIn }) {

    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
    const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");

    const [emailValidationMessage, setEmailValidationMessage] = useState("");
    const [passwordValidationMessages, setPasswordValidationMessages] = useState<string[]>([]);

    const [isEmailInvalid, setIsEmailInvalid] = useState(false);
    const [isPasswordInvalid, setIsPasswordInvalid] = useState(false);

    const [emailErrorVisible, setEmailErrorVisible] = useState(false);
    const [passwordErrorVisible, setPasswordErrorVisible] = useState(false);

    const submitSignIn = async () => {
        setError(null);
        setIsEmailInvalid(false);
        setIsPasswordInvalid(false);

        const emailError = validateEmailAndLength(email);
        const passwordErrors = validatePassword(password);

        if (emailError) {
            setIsEmailInvalid(true);
            setEmailValidationMessage(emailError);
            return;
        }

        if (passwordErrors.length > 0) {
            setIsPasswordInvalid(true);
            setPasswordValidationMessages(passwordErrors);
            return;
        }

        const { error } = await signIn(email, password);
        if (error) {
            setError(error.code);
            if (error.code === "auth/invalid-credential" || error.code === "auth/invalid-email" || error.code === "auth/user-not-found") {
                setIsEmailInvalid(true);
                setEmailValidationMessage("Invalid email or user not found.");
                setIsPasswordInvalid(true);
                setPasswordValidationMessages(["Invalid password."]);
            } else if (error.code === "auth/wrong-password") {
                setIsPasswordInvalid(true);
                setPasswordValidationMessages(["Invalid password."]);
            } else if (error.code === "auth/missing-password") {
                setIsPasswordInvalid(true);
                setPasswordValidationMessages(["Please enter your password."]);
            }
        } else {
            router.push('/home');
        }
    };

    const sendResetEmail = async () => {
        const site = process.env.NEXT_PUBLIC_SUPABASE_REDIRECT_URL || "https://www.example_website.ca";
        const { data, error } = await supabaseClient.auth.resetPasswordForEmail(forgotPasswordEmail, { redirectTo: site + '/resetPassword' });
        if (!error) {
            console.log(`Sent forgot password! Data: ${JSON.stringify(data, null, 4)}`);
            setForgotPasswordOpen(false);
        } else {
            console.log(`Error sending forgot password: ${JSON.stringify(error, null, 4)}`);
        }
    };

    const forgotPasswordPopup = () => {
        return (
            <div className="fixed flex justify-center items-center w-screen h-screen top-0 left-0 bg-gray-900 bg-opacity-50 z-50" onClick={(e) => { if (e.target === e.currentTarget) setForgotPasswordOpen(false); }}>
                <div className="bg-white p-8 rounded-lg shadow-lg min-w-[60vh] min-h-[30vh]">
                    <h2 className="text-2xl font-bold mb-4">Forgot your password?</h2>
                    <p className="mb-1 text-md">Email</p>
                    <TextField style="w-full" text={forgotPasswordEmail} onChange={setForgotPasswordEmail} placeholder="john.smith@gmail.com" isInvalid={false} /> {/* No validation here yet */}
                    <div className="flex justify-between mt-8">
                        <Button text="Close" onClick={() => setForgotPasswordOpen(false)} />
                        <Button text="Send link" onClick={async () => await sendResetEmail()} icon="arrow" filled />
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            <div className="">
                <div className="text-xl font-bold mb-4">Sign In</div>
                <div className="flex flex-col space-y-4">
                    <div className="flex flex-col relative">
                        <p className="mb-1 text-md">Email</p>
                        <TextField
                            text={email}
                            onChange={setEmail}
                            placeholder="name@email.com"
                            hidden={false}
                            isInvalid={isEmailInvalid}
                        />
                        {isEmailInvalid && (
                            <div
                                className="absolute right-2 top-[3.15rem] transform -translate-y-1/2 cursor-pointer"
                                onMouseEnter={() => setEmailErrorVisible(isEmailInvalid)}
                                onMouseLeave={() => setEmailErrorVisible(false)}
                            >
                                <FiAlertCircle className="text-red-500" size={25} />
                            </div>
                        )}
                        {emailErrorVisible && (
                            <div className="absolute right-8 top-1/2 transform -translate-y-1/2 bg-red-100 border border-red-400 text-red-700 px-3 py-1 rounded shadow-md z-10">
                                {emailValidationMessage}
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col relative">
                        <p className="mb-1 text-md">Password</p>
                        <TextField
                            text={password}
                            onChange={setPassword}
                            placeholder="**********"
                            hidden={true}
                            isInvalid={isPasswordInvalid}
                        />
                        {isPasswordInvalid && (
                            <div
                                className="absolute right-2 top-[3.15rem] transform -translate-y-1/2 cursor-pointer"
                                onMouseEnter={() => setPasswordErrorVisible(isPasswordInvalid)}
                                onMouseLeave={() => setPasswordErrorVisible(false)}
                            >
                                <FiAlertCircle className="text-red-500" size={25} />
                            </div>
                        )}
                        {passwordErrorVisible && (
                            <div className="absolute right-8 top-1/2 transform -translate-y-1/2 bg-red-100 border border-red-400 text-red-700 px-3 py-1 rounded shadow-md z-10">
                                {passwordValidationMessages.join(', ')}
                            </div>
                        )}
                        <div className="mt-3 mb-2 text-gray-500 cursor-pointer" onClick={() => setForgotPasswordOpen(true)}>Forgot your password?</div>
                    </div>
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
                <div className="">
                    <div className="flex justify-between mt-4">
                        <Button text="Sign Up" onClick={() => setIsSignIn(false)} style="border-[3px] border-red-800"
                                filled={false}/>
                        <Button text="Sign In" onClick={async () => await submitSignIn()} style="ml-4" icon="arrow"
                                filled/>
                    </div>
                </div>
            </div>
            {forgotPasswordOpen && forgotPasswordPopup()}
        </>
    );
}
