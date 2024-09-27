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
import { isToday, isYesterday, isThisWeek, isThisMonth, parseISO } from 'date-fns';

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
    const [directNotifications, setDirectNotifications] = useState(true);
    const popUpRef = useRef(null);
    const popUpBellRef = useRef(null);

    const refreshNotifications = async () => {
        setLoadingNotifications(true);
        setNotificationsOpen(true);
        await callAPI('get-notifications').then((data) => setNotifications(data.data));
        setLoadingNotifications(null);
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

    const renderNotifications = () => {

        if (loadingNotifications === true) {
            return;
        }

        const notificationTrash = (id) => {
            return (
                <div
                    onClick={async () => {
                        setLoadingNotifications(id);
                        await callAPI('delete-notification', { notificationIds: id });
                        setLoadingNotifications(false);
                    }}
                >
                    { loadingNotifications === id
                        ? (<TbRefresh className="w-4 h-4 ml-2 animate-spin-counter-clockwise"/>)
                        : (<FiTrash className="w-4 h-4 ml-2 hover:opacity-75 duration-75 cursor-pointer"/>)
                    }
                </div>
            );
        }

        const getNotificationRender = (notification, last) => {
            return (
                <div className="mx-4 mt-3">
                    <div>
                        <div
                            className="text-sm flex hover:opacity-75 duration-75 cursor-pointer"
                            onClick={() => {
                                setNotificationsOpen(false);
                                router.push(notification.link);
                            }}
                        >
                            <FaRegNewspaper className="w-6 h-6 mt-3 mr-3"/>
                            {notification.title}
                        </div>

                        <div className="text-xs text-gray-500 flex justify-between my-2">
                            {new Date(notification.date).toLocaleString()}
                            {notificationTrash(notification.id)}
                        </div>
                    </div>

                    {!last && <div className="border-[1px] rounded-full mt-3"/>}
                </div>
            );
        }

        const notificationOrder = {
            'Today': [],
            'Yesterday': [],
            'This Week': [],
            'This Month': [],
            'Older': []
        };

        const desiredNotifications = notifications.filter((n) => n.direct === directNotifications);
        if (desiredNotifications.length === 0) {
            return (
                <div className="flex justify-center">
                    <div className="text-lg font-sans mt-4">
                        No notifications
                    </div>
                </div>
            );
        }

        desiredNotifications.forEach(notification => {
            const date = parseISO(notification.date);

            if (isToday(date)) {
                notificationOrder['Today'].push(notification);
            } else if (isYesterday(date)) {
                notificationOrder['Yesterday'].push(notification);
            } else if (isThisWeek(date, { weekStartsOn: 1 })) {
                notificationOrder['This Week'].push(notification);
            } else if (isThisMonth(date)) {
                notificationOrder['This Month'].push(notification);
            } else {
                notificationOrder['Older'].push(notification);
            }
        });

        for (const category in notificationOrder) {
            notificationOrder[category].sort((a, b) => parseISO(b.date) - parseISO(a.date));
        }

        const response = [];
        for (const [timespan, timedNotifications] of Object.entries(notificationOrder)) {
            if (timedNotifications.length === 0) {
                continue;
            }

            response.push(
                <div className="text-xs font-bold bg-gray-50 w-full px-4 py-2">
                    {timespan.toUpperCase()}
                </div>
            );

            timedNotifications.forEach((n, index) => {
                const last = index === timedNotifications.length - 1;
                response.push(getNotificationRender(n, last));
            });
        }

        return response;
    }

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
                                className="absolute right-0 mt-2 w-72 h-72 font-sans bg-white shadow-lg rounded-lg border-gray-300 border-[1px] overflow-y-scroll no-scrollbar"
                            >
                                <div className="mb-2 mx-4">
                                    <div className="flex justify-between items-center">
                                        <div className="text-lg font-semibold mt-4">
                                            Notifications
                                        </div>

                                    </div>
                                    <div className="flex justify-between mt-3">
                                        <div className="flex gap-4">
                                            <button
                                                className={`text-sm font-medium ${directNotifications ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-700 hover:text-gray-900'} py-1`}
                                                onClick={() => setDirectNotifications(true)}
                                            >
                                                Direct
                                            </button>
                                            <button
                                                className={`text-sm font-medium ${directNotifications ? 'text-gray-700 hover:text-gray-900' : 'text-blue-600 border-b-2 border-blue-600'} py-1`}
                                                onClick={() => setDirectNotifications(false)}
                                            >
                                                Other
                                            </button>
                                        </div>
                                        <button className="text-sm text-blue-600 hover:text-blue-800">
                                            Delete all
                                        </button>
                                    </div>
                                </div>

                                {loadingNotifications === true && (
                                    <div className="flex justify-center">
                                        <TbRefresh
                                            className={`mb-4 mt-2 hover:opacity-75 duration-75 cursor-pointer animate-spin-counter-clockwise`}
                                        />
                                    </div>
                                )}

                                { renderNotifications() }
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
