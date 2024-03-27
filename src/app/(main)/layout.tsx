"use client";
import Link from 'next/link';
import '../globals.css';
import { auth, callApi } from '@/config/firebase';
import { useRouter } from "next/navigation";
import { useState, useEffect } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import styles from './DropdownMenu.module.css'
import AuthForm from '@/components/AuthForm';

export default function LearnerLayout({
   children,
}: {
    children: React.ReactNode
}) {
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPass] = useState("")

    const [isOpen, setIsOpen] = useState(false)
    
    const toggleDropdown = () => setIsOpen(!isOpen)

    const router = useRouter();
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

    const logout = async () => {
        await auth.signOut()
            .then(() => router.push('/'));
    }

    // Takes time to detect if the user is logged in; if so, check if they're an admin
    auth.onAuthStateChanged((user) => {
        if (user) {
            auth.currentUser?.getIdTokenResult()
                .then((idTokenResult) => setIsAdmin(!!idTokenResult.claims.admin))
                .catch((error) => console.log(`Error fetching user ID token: ${error}`));
        }
    });

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

    return (
        <html lang="en">
        <body className="h-[100vh] px-20 bg-gray-100 overflow-x-hidden">
        <div className="flex flex-row px-12 h-[13vh] justify-between items-center bg-white rounded-b-2xl shadow-custom">
            <Link href="/home" className="font-bold text-4xl">OpenLMS</Link>
            <div className={styles.dropdown}>
                <div className="flex flex-row justify-between text-2xl mr-[5vh]">
                    <Link href="/home" className="hover:opacity-50 duration-75 hover:rounded-2xl hover:bg-white">Home</Link>
                    {isAdmin && <Link href="/admin/tools" className="hover:opacity-50 duration-75 hover:rounded-2xl hover:bg-white">Admin Tools</Link>}
                    <div className="border-l border-black h-8 mr-[5vh] ml-[5vh]"></div>
                    <button className="hover:opacity-50" onClick={toggleDropdown}>
                        {isOpen ? (
                            <AuthForm 
                            email={email}
                            setEmail={setEmail}
                            password={password}
                            setPass={setPass}
                            name={name}
                            setName={setName}
                            showName={false}
                            showEmail={false}
                            showPassword={false}
                            showJustName={true}
                            />
                            ) : (
                            <AuthForm 
                            email={email}
                            setEmail={setEmail}
                            password={password}
                            setPass={setPass}
                            name={name}
                            setName={setName}
                            showName={false}
                            showEmail={false}
                            showPassword={false}
                            showJustName={true}
                            />
                            )
                        }
                    </button>
                    <div className="flex flex-row justify-right">
                        {isOpen && (
                            <div className={styles.menu}>
                                <Link href="/profile" className="hover:opacity-50 duration-75 hover:rounded-2xl hover:bg-white p-4" onClick={toggleDropdown}>View Profile</Link>
                                <div onClick={async () => await logout()} className="cursor-pointer hover:opacity-50 duration-75 hover:rounded-2xl hover:bg-white p-4">Log
                                    Out
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>        
        </div>
        <div className='flex h-[85vh] mt-[2vh] overflow-scroll rounded-2xl sm:no-scrollbar'>
            {children}
        </div>
        <footer className="flex flex-col justify-between items-center bg-gray-800 rounded-t-2xl shadow-custom">
            <form onSubmit={handleSubmitFeedback} className="flex flex-col justify-center items-center p-4">
                <label htmlFor="feedback" className="text-white">
                    Request technical support:
                </label>
                <textarea
                    id="feedback"
                    name="feedback"
                    value={feedback}
                    onChange={handleFeedbackChange}
                    className="block w-full md:w-96 rounded-md mt-2 p-2"
                    rows={4}
                    required
                ></textarea>
                <button
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mt-2"
                >
                    Submit
                </button>
                {feedbackSent && <p className="text-green-500">Feedback sent successfully!</p>}
            </form>
            <span className="text-white p-4">&copy; {new Date().getFullYear()} OpenLMS. All rights reserved.</span>
            <div className="flex flex-col items-left">
                <Link href="/empty.pdf" className="text-1xl text-white">Access Platform User Guide</Link>
            </div>
        </footer>
        </body>
        </html>
    )
}
