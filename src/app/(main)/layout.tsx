"use client";
import Link from 'next/link';
import '../globals.css';
import { auth, callApi } from '@/config/firebase';
import { useRouter } from "next/navigation";
import { useState } from 'react';
import Button from "@/components/Button";

export default function LearnerLayout({ children }: { children: React.ReactNode }) {

    const router = useRouter();
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const [userName, setUserName] = useState<string | null>(null);

    // Takes time to detect if the user is logged in; if so, check if they're an admin
    auth.onAuthStateChanged((user) => {
        if (user) {
            auth.currentUser?.getIdTokenResult()
                .then((idTokenResult) => setIsAdmin(!!idTokenResult.claims.admin))
                .catch((error) => console.log(`Error fetching user ID token: ${error}`));

            setUserName(user.displayName);
        }
    });

    const [showSupportForm, setShowSupportForm] = useState(false);
    const [feedback, setFeedback] = useState('');
    const [feedbackSent, setFeedbackSent] = useState(false);

    const handleFeedbackChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setFeedback(event.target.value);
    };

    const handleSubmitFeedback = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        try {
            await callApi('sendPlatformFeedback', { feedback });
            setFeedback('');
            setFeedbackSent(true);
        } catch (error) {
            console.error('Error sending feedback:', error);
        }
    };

    const handleSupportRequest = () => {
        setShowSupportForm(true);
    };

    return (
        <html lang="en">
        <body className="h-[100vh] px-20 bg-gray-100 overflow-x-hidden">
        <div className="flex flex-row px-12 h-[13vh] items-center bg-white rounded-b-2xl shadow-custom">
            <Link href="/home" className="font-bold text-4xl">OpenLMS</Link>
            <div className="flex ml-auto space-x-10 text-2xl">
                {isAdmin && <Link href="/admin/tools" className="hover:opacity-50 duration-75">Admin Tools</Link>}
                <Link href="/profile" className="hover:opacity-50 duration-75">View Profile</Link>
            </div>
        </div>
        
        <div className='flex h-[85vh] mt-[2vh] overflow-scroll rounded-2xl sm:no-scrollbar'>
            {children}
        </div>

        {showSupportForm && (
            <div className="fixed flex justify-center items-center w-full h-full top-0 left-0 z-50 bg-white bg-opacity-50">
                <div className="flex flex-col w-1/2 bg-white p-12 rounded-xl text-lg shadow-xl">
                    <div className="text-lg mb-2">Request Technical Support</div>
                    <form onSubmit={handleSubmitFeedback} className="flex flex-col justify-left">
                                <textarea
                                    value={feedback}
                                    onChange={handleFeedbackChange}
                                    className="block w-full md:w-96 rounded-md mt-2 p-2 border-2 border-gray-800"
                                    rows={4}
                                    required
                                    placeholder="Enter your request here"
                                ></textarea>
                        <div className="flex flex-row mt-4">
                            <Button text="Cancel" onClick={() => {
                                setShowSupportForm(false);
                                setFeedbackSent(false);
                            }} style="mr-4" />
                            <Button text="Submit" onClick={handleSubmitFeedback} filled/>
                        </div>
                        {feedbackSent && <p className="text-green-500 mt-2">Request sent successfully!</p>}
                    </form>
                </div>
            </div>
        )}

        <footer className="flex flex-col justify-between items-center bg-gray-800 rounded-t-2xl shadow-custom">
            <div className="flex flex-row justify-center mt-6">
                <Button text="Access Platform User Guide" onClick={() => {}} style="mr-4 text-sm" filled/>
                <Button text="Request Technical Support" onClick={handleSupportRequest} style="text-sm" filled/>
            </div>
            <span className="text-white p-4">&copy; {new Date().getFullYear()} OpenLMS. All rights reserved.</span>
        </footer>
        </body>
        </html>
    )
}
