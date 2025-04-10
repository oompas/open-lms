import { useState } from 'react';
import { callAPI, signUp } from "@/helpers/supabase.ts";
import Button from "@/components/Button.tsx";
import TextField from "@/components/TextField.tsx";
import { validateEmailAndLength, validatePassword } from "@/components/TextField";
import { FiAlertCircle, FiInfo } from 'react-icons/fi'; // Import icons

export default function SignUp({ setIsSignIn }) {

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showVerifyEmailPopup, setShowVerifyEmailPopup] = useState(false);

    const [emailValidationMessage, setEmailValidationMessage] = useState("");
    const [passwordValidationMessages, setPasswordValidationMessages] = useState<string[]>([]);

    const [isNameInvalid, setIsNameInvalid] = useState(false);
    const [isEmailInvalid, setIsEmailInvalid] = useState(false);
    const [isPasswordInvalid, setIsPasswordInvalid] = useState(false);

    const [emailErrorVisible, setEmailErrorVisible] = useState(false);
    const [passwordErrorVisible, setPasswordErrorVisible] = useState(false);
    const [nameErrorVisible, setNameErrorVisible] = useState(false);
    const [passwordInfoVisible, setPasswordInfoVisible] = useState(false);

    const handleNameChange = (newName: string) => {
        setName(newName);
        setIsNameInvalid(false); // Reset error on change
    };

    const handleEmailChange = (newEmail: string) => {
        setEmail(newEmail);
        setIsEmailInvalid(false); // Reset error on change
        setEmailValidationMessage(validateEmailAndLength(newEmail));
    };

    const handlePasswordChange = (newPass: string) => {
        setPassword(newPass);
        setIsPasswordInvalid(false); // Reset error on change
        setPasswordValidationMessages(validatePassword(newPass));
    };

    const handleEmailIconMouseEnter = () => {
        if (isEmailInvalid) {
            setEmailErrorVisible(true);
        }
    };

    const handleEmailIconMouseLeave = () => {
        setEmailErrorVisible(false);
    };

    const handlePasswordIconMouseEnter = () => {
        if (isPasswordInvalid) {
            setPasswordErrorVisible(true);
        }
    };

    const handlePasswordIconMouseLeave = () => {
        setPasswordErrorVisible(false);
    };

    const handleNameIconMouseEnter = () => {
        if (isNameInvalid) {
            setNameErrorVisible(true);
        }
    };

    const handleNameIconMouseLeave = () => {
        setNameErrorVisible(false);
    };

    const handlePasswordInfoMouseEnter = () => {
        if (!isPasswordInvalid && passwordValidationMessages.length === 0) {
            setPasswordInfoVisible(true);
        }
    };

    const handlePasswordInfoMouseLeave = () => {
        setPasswordInfoVisible(false);
    };

    const submitSignUp = async () => {
        setIsNameInvalid(false);
        setIsEmailInvalid(false);
        setIsPasswordInvalid(false);

        let hasError = false;

        if (!name.trim()) {
            setIsNameInvalid(true);
            setNameErrorVisible(true);
            hasError = true;
        }

        const emailError = validateEmailAndLength(email);
        if (emailError) {
            setIsEmailInvalid(true);
            setEmailValidationMessage(emailError);
            setEmailErrorVisible(true);
            hasError = true;
        }

        const passwordErrors = validatePassword(password);
        if (password.length < 10 || passwordErrors.length > 0) {
            setIsPasswordInvalid(true);
            setPasswordValidationMessages([...passwordErrors, "Password must be at least 10 characters long and meet all requirements."]);
            setPasswordErrorVisible(true);
            hasError = true;
        }

        if (hasError) {
            return;
        }

        const { data, error } = await signUp(email, password, name);
        if (error) {
            console.error("Error signing up:", error.message);
            if (error.message.includes("email address is already in use")) {
                setIsEmailInvalid(true);
                setEmailValidationMessage("This email address is already in use.");
                setEmailErrorVisible(true);
            }
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
                <div className="flex flex-col relative">
                    <p className="mb-1 text-md">Name</p>
                    <TextField
                        text={name || ""}
                        onChange={handleNameChange}
                        placeholder="John Doe"
                        hidden={false}
                        isInvalid={isNameInvalid}
                    />
                    {isNameInvalid && (
                        <div
                            className="absolute right-2 top-[3.15rem] transform -translate-y-1/2 cursor-pointer"
                            onMouseEnter={handleNameIconMouseEnter}
                            onMouseLeave={handleNameIconMouseLeave}
                        >
                            <FiAlertCircle className="text-red-500" size={25} />
                        </div>
                    )}
                    {nameErrorVisible && isNameInvalid && (
                        <div className="absolute right-8 top-1/2 transform -translate-y-1/2 bg-red-100 border border-red-400 text-red-700 px-3 py-1 rounded shadow-md z-10">
                            Please enter your name.
                        </div>
                    )}
                </div>
                <div className="flex flex-col relative">
                    <p className="mb-1 text-md">Email</p>
                    <TextField
                        text={email}
                        onChange={handleEmailChange}
                        placeholder="name@email.com"
                        hidden={false}
                        isInvalid={isEmailInvalid}
                    />
                    {isEmailInvalid && (
                        <div
                            className="absolute right-2 top-[3.15rem] transform -translate-y-1/2 cursor-pointer"
                            onMouseEnter={handleEmailIconMouseEnter}
                            onMouseLeave={handleEmailIconMouseLeave}
                        >
                            <FiAlertCircle className="text-red-500" size={25} />
                        </div>
                    )}
                    {emailErrorVisible && isEmailInvalid && (
                        <div className="absolute right-8 top-1/2 transform -translate-y-1/2 bg-red-100 border border-red-400 text-red-700 px-3 py-1 rounded shadow-md z-10">
                            {emailValidationMessage}
                        </div>
                    )}
                </div>
                <div className="flex flex-col relative">
                    <p className="mb-1 text-md">Password</p>
                    <TextField
                        text={password}
                        onChange={handlePasswordChange}
                        placeholder="**********"
                        hidden={true}
                        isInvalid={isPasswordInvalid}
                    />
                    {isPasswordInvalid && (
                        <div
                            className="absolute right-2 top-[3.15rem] transform -translate-y-1/2 cursor-pointer"
                            onMouseEnter={handlePasswordIconMouseEnter}
                            onMouseLeave={handlePasswordIconMouseLeave}
                        >
                            <FiAlertCircle className="text-red-500" size={25} />
                        </div>
                    )}
                    {passwordErrorVisible && isPasswordInvalid && (
                        <div className="absolute right-8 top-1/2 transform -translate-y-1/2 bg-red-100 border border-red-400 text-red-700 px-3 py-1 rounded shadow-md z-10">
                            {passwordValidationMessages.join(', ')}
                        </div>
                    )}
                    {!isPasswordInvalid && passwordValidationMessages.length === 0 && (
                        <div
                            className="absolute right-2 top-[3.15rem] transform -translate-y-1/2 cursor-pointer text-gray-500"
                            onMouseEnter={handlePasswordInfoMouseEnter}
                            onMouseLeave={handlePasswordInfoMouseLeave}
                        >
                            <FiInfo size={25} color={'#0d87de'}/>
                        </div>
                    )}
                    {passwordInfoVisible && !isPasswordInvalid && passwordValidationMessages.length === 0 && (
                        <div className="absolute right-8 top-1/2 transform -translate-y-1/2 bg-gray-100 border border-gray-300 text-gray-700 px-3 py-1 rounded shadow-md z-10">
                            Password must be at least 10 characters long, include uppercase, lowercase, numbers, and special characters.
                        </div>
                    )}
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
