"use client";
import Link from 'next/link';
import '../globals.css';
import { ApiEndpoints, callApi } from '@/config/firebase';
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from 'react';
import Button from "@/components/Button";
import { MdAdminPanelSettings, MdChevronLeft } from 'react-icons/md';
import TextField from '@/components/TextField';
import { useSession } from "@supabase/auth-helpers-react";
import { IoNotifications } from "react-icons/io5";
import { CgProfile } from "react-icons/cg";
import { FiTrash } from "react-icons/fi";
import { FaRegNewspaper } from "react-icons/fa6";
import { TbRefresh } from "react-icons/tb";
import { callAPI } from "@/config/supabase.ts";

export default function LearnerLayout({ children }: { children: React.ReactNode }) {

    const router = useRouter();
    const session = useSession();

    if (document?.readyState === 'complete' && session === null) {
        router.push('/');
    }

    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

    const [notifications, setNotifications] = useState([]);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [loadingNotifications, setLoadingNotifications] = useState(false);
    const popUpRef = useRef(null);
    const popUpBellRef = useRef(null);

    const refreshNotifications = async () => {
        setLoadingNotifications(true);
        setNotificationsOpen(true);
        await callAPI('get-notifications').then((data) => setNotifications(data.data));
        setLoadingNotifications(false);
    }

    // Toggle pop-up on icon click
    const handleIconClick = async (event) => {
        if (!notificationsOpen) {
            await refreshNotifications();
        }
    };

    // Close pop-up when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (popUpRef.current && !popUpRef.current.contains(event.target)) {
                setNotificationsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => { document.removeEventListener('mousedown', handleClickOutside); };
    }, [popUpRef, popUpBellRef]);

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
                <div className="flex ml-auto text-2xl">
                    <div className="relative">
                        <IoNotifications
                            ref={popUpBellRef}
                            className="mt-[6px] hover:opacity-75 duration-75 cursor-pointer"
                            onClick={(e) => handleIconClick(e)}
                        />
                        {notificationsOpen && (
                            <div
                                ref={popUpRef}
                                className="absolute right-0 mt-2 w-64 bg-white shadow-lg rounded-lg p-4 border-gray-300 border-[1px] overflow-y-scroll no-scrollbar h-64"
                            >
                                {loadingNotifications && (
                                    <div className="flex justify-center">
                                        <TbRefresh
                                            className={`mb-4 mt-2 hover:opacity-75 duration-75 cursor-pointer animate-spin-counter-clockwise`}
                                            onClick={async () => await refreshNotifications()}
                                        />
                                    </div>
                                )}
                                {(!loadingNotifications && notifications.length === 0) && (
                                    <div className="flex justify-center">
                                        <div className="text-lg">
                                            No notifications!
                                        </div>
                                    </div>
                                )}

                                {!loadingNotifications && notifications.map((notification, index) =>
                                    <>
                                        <div
                                            className="hover:opacity-75 duration-75 cursor-pointer"
                                            onClick={() => {
                                                setNotificationsOpen(false);
                                                router.push(notification.link);
                                            }}
                                        >
                                            <div className="text-sm flex">
                                                <FaRegNewspaper className="w-6 h-6 mt-3 mr-3"/>
                                                {notification.title}
                                            </div>

                                            <div className="text-xs text-gray-500 flex justify-between my-2">
                                                {new Date(notification.date).toLocaleString()}
                                                <FiTrash
                                                    className="w-4 h-4"
                                                    onClick={() => {
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {index !== notifications.length - 1 &&
                                            <div className="border-[1px] rounded-full my-3"/>}
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {isAdmin &&
                        <MdAdminPanelSettings
                            className="w-8 h-8 ml-6 hover:opacity-75 duration-75 cursor-pointer"
                            onClick={() => router.push('/admin/tools')}
                        />
                    }

                    <CgProfile
                        className="w-8 h-8 ml-6 hover:opacity-75 duration-75 cursor-pointer"
                        onClick={() => router.push('/profile')}
                    />
                </div>
            </div>

            <div className='flex h-[85vh] mt-[2vh] overflow-scroll rounded-2xl sm:no-scrollbar'>
                {children}
            </div>

            {showSupportForm && (
                <div
                    className="fixed flex justify-center items-center w-full h-full top-0 left-0 z-50 bg-white bg-opacity-50">
                    <div className="flex flex-col w-1/2 bg-white p-12 rounded-xl text-lg shadow-xl">
                        <div className="text-lg mb-2">Request platform support or report technical issues</div>
                        <TextField text={feedback} onChange={setFeedback} area placeholder="Type your message here..."/>
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
