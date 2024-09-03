"use client";
import Link from 'next/link';
import '../globals.css';
import { ApiEndpoints, callApi } from '@/config/firebase';
import { useRouter } from "next/navigation";
import { useEffect, useState } from 'react';
import Button from "@/components/Button";
import { MdChevronLeft } from 'react-icons/md';
import TextField from '@/components/TextField';
import { useSession } from "@supabase/auth-helpers-react";

export default function LearnerLayout({ children }: { children: React.ReactNode }) {

    const router = useRouter();
    const session = useSession();

    if (document?.readyState === 'complete' && session === null) {
        router.push('/');
    }

    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const [selectedLink, setSelectedLink] = useState('/admin/tools');

    const handleLinkClick = (path: string) => {
        setSelectedLink(path);
        router.push(path);
    };

    useEffect(() => {
       const role = session?.user?.user_metadata?.role;
        if (role === 'Admin' || role === 'Developer') {
            setIsAdmin(true);
        }
    }, [session]);

    const [showSupportForm, setShowSupportForm] = useState(false);
    const [feedback, setFeedback] = useState('');
    const [feedbackSent, setFeedbackSent] = useState(false);
    const [showFooter, setShowFooter] = useState(false);

    const handleSubmitFeedback = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        try {
            await callApi(ApiEndpoints.SendPlatformFeedback, { feedback });
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
                <Link href="/home" className="font-bold text-4xl flex items-center">
                    <img
                        src="/openlms.png"
                        alt="OpenLMS Logo"
                        className="h-10 w-auto mr-2"
                    />
                    OpenLMS
                </Link>
                <div className="flex ml-auto space-x-10 text-2xl">
                    {isAdmin && <a onClick={() => handleLinkClick('/admin/tools')} className={`hover:opacity-50 duration-75 cursor-pointer ${selectedLink === '/admin/tools' ? 'underline' : ''}`}>Admin Tools</a>}
                    <a onClick={() => handleLinkClick('/profile')} className={`hover:opacity-50 duration-75 cursor-pointer ${selectedLink === '/profile' ? 'underline' : ''}`}>View Profile</a>
                </div>
            </div>
            
            <div className='flex h-[85vh] mt-[2vh] overflow-scroll rounded-2xl sm:no-scrollbar'>
                {children}
            </div>

            { showSupportForm && (
                <div className="fixed flex justify-center items-center w-full h-full top-0 left-0 z-50 bg-white bg-opacity-50">
                    <div className="flex flex-col w-1/2 bg-white p-12 rounded-xl text-lg shadow-xl">
                        <div className="text-lg mb-2">Request platform support or report technical issues</div>
                        <TextField text={feedback} onChange={setFeedback} area placeholder="Type your message here..." />
                        <form onSubmit={handleSubmitFeedback} className="flex flex-col justify-left">
                            <div className="flex flex-row ml-auto mt-4">
                                <Button text="Cancel" onClick={() => {
                                    setShowSupportForm(false);
                                    setFeedbackSent(false);
                                }} style="mr-4" />
                                <Button text="Submit" onClick={handleSubmitFeedback} filled/>
                            </div>
                            { feedbackSent && <p className="text-green-700 mt-4">Request sent successfully - platform admins will be in touch once your message is received!</p> }
                        </form>
                    </div>
                </div>
            )}

            <button 
                className={"fixed bg-gray-800 right-28 rounded-t-md duration-100 "+(showFooter ? "bottom-20" : "bottom-0")}
                onClick={() => setShowFooter(!showFooter)}
            >
                <MdChevronLeft color="white" className={showFooter ? "-rotate-90" : "rotate-90"} size={38} />
            </button>
            <footer className={"flex flex-row items-center fixed w-auto px-4 rounded-t-2xl h-20 left-20 right-20 shadow-custom bg-gray-800 duration-100 "+(showFooter ? "bottom-0" : "-bottom-20")}>
                <div className="flex flex-row justify-center">
                    <Link href="/Learner_Guide.pdf" target="_blank">
                        <Button text="Access Platform User Guide" onClick={() => {}} style="mr-4 text-sm" filled/>
                    </Link>
                    <Button text="Request Technical Support" onClick={handleSupportRequest} style="text-sm" filled/>
                </div>
                <span className="text-white ml-auto">&copy; {new Date().getFullYear()} OpenLMS. All rights reserved.</span>
            </footer>
        </body>
        </html>
    )
}
