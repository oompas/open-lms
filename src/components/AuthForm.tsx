import TextField from "./TextField";
import {validateEmailAndLength} from "./TextField"
import {validatePassword} from "./TextField"
import { useState, useEffect } from 'react';

export default function AuthForm({
    email,
    setEmail,
    password,
    setPass,
    name,
    setName,
    showName,
    onForgotPassword,
    isSignUpPage
 } : {
     email: string,
     setEmail: any,
     password: string,
     setPass: any,
     name?: string,
     setName?: any,
     showName: boolean,
     onForgotPassword?: any
     isSignUpPage?: boolean // And its type here
 }) {
     // Add a new state for the email validation message
     const [emailValidationMessage, setEmailValidationMessage] = useState("");
     const handleEmailChange = (newEmail: string) => {
        setEmail(newEmail);
        if (isSignUpPage) {
            setEmailValidationMessage(validateEmailAndLength(newEmail));
        }
    };
    // Add a new state for the password validation messages
    const [passwordValidationMessages, setPasswordValidationMessages] = useState<string[]>([]);
    const handlePasswordChange = (newPass: string) => {
        setPass(newPass);
        setPasswordValidationMessages(validatePassword(newPass));
    };

    // Use useEffect to validate the initial password
    useEffect(() => {
        setPasswordValidationMessages(validatePassword(password));
    }, []);
 

    return (
        <div className="flex flex-col space-y-4">
            {showName && (
                <div className="flex flex-col">
                    <p className="mb-1 text-md">Name</p>
                    <TextField text={name || ""} onChange={setName} placeholder="John" hidden={false}/>
                </div>
            )}
            <div className="flex flex-col">
                <p className="mb-1 text-md">Email</p>
                <TextField text={email} onChange={handleEmailChange} placeholder="john@doe.com" hidden={false}/>
                {/* Conditionally display the email validation message */}
                {isSignUpPage && <p className="mt-1 text-sm text-red-500">{emailValidationMessage}</p>}
            </div>
            <div className="flex flex-col">
                <p className="mb-1 text-md">Password</p>
                <TextField text={password} onChange={handlePasswordChange} placeholder="******" hidden={true}/>
                {/* Conditionally display the password validation messages */}
                {isSignUpPage && passwordValidationMessages.map((message, index) => (
                    <p key={index} className="mt-1 text-sm text-gray-500">{message}</p>
                ))}
                {onForgotPassword && (
                    <p className="mt-2 text-gray-500 cursor-pointer" onClick={onForgotPassword}>Forgot your password?</p>
                )}
            </div>
        </div>
    )
}