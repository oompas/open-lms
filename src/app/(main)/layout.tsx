"use client";
import Link from 'next/link';
import '../globals.css';
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from 'react';
import Button from "@/components/Button";
import { MdAdminPanelSettings } from 'react-icons/md';
import TextField from '@/components/TextField';
import { useSession } from "@supabase/auth-helpers-react";
import { CgProfile } from "react-icons/cg";
import Notifications from "@/app/(main)/Notifications.tsx";
import { callAPI } from "@/helpers/supabase.ts";
import {
    differenceInDays, differenceInHours, differenceInMinutes,
    differenceInMonths, differenceInSeconds, differenceInWeeks,
    differenceInYears, parseISO
} from "date-fns";

export default function LearnerLayout({ children }: { children: React.ReactNode }) {

    const router = useRouter();
    const session = useSession();

    const getNotifications = () => {

        const formatDateDifference = (now, date) => {
            const differences = [
                { unit: 'second', diffFn: differenceInSeconds, threshold: 60 },
                { unit: 'minute', diffFn: differenceInMinutes, threshold: 60 },
                { unit: 'hour', diffFn: differenceInHours, threshold: 24 },
                { unit: 'day', diffFn: differenceInDays, threshold: 7 },
                { unit: 'week', diffFn: differenceInWeeks, threshold: 5 },
                { unit: 'month', diffFn: differenceInMonths, threshold: 12 },
                { unit: 'year', diffFn: differenceInYears, threshold: Infinity }
            ];

            for (const { unit, diffFn, threshold } of differences) {
                const diff = diffFn(now, date);
                if (diff < threshold) {
                    return `${diff} ${unit}${diff === 1 ? '' : 's'} ago`;
                }
            }

            throw new Error(`Error parsing notification date difference: fallthrough case`);
        };

        callAPI('get-notifications')
            .then((rsp) => {
                const notifications = rsp.data;
                const now = new Date();

                notifications.forEach((notification) => {
                    const date = parseISO(notification.date);
                    notification["date"] = formatDateDifference(now, date);
                });

                setNotifications(notifications);
            });
    };

    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const startTime = useRef(new Date().getTime());

    const [showSupportForm, setShowSupportForm] = useState(false);
    const [feedback, setFeedback] = useState('');
    const [feedbackSent, setFeedbackSent] = useState(false);

    const [notifications, setNotifications] = useState<any[]>([]);

    // Route to sign in screen if user isn't logged in
    useEffect(() => {
        if (session === null && new Date().getTime() > startTime.current + 1_000) {
            router.push('/');
        }
    }, [session, isAdmin, router]);

    // Get notifications on load, then refresh every 10 minutes after
    useEffect(() => {
        getNotifications();

        const intervalId = setInterval(() => {
            getNotifications();
        }, 1000 * 60 * 10);

        return () => clearInterval(intervalId);
    }, []);

    useEffect(() => {
       const role = session?.user?.user_metadata?.role;
        if (role === 'Admin' || role === 'Developer') {
            setIsAdmin(true);
        }
    }, [session]);

    const handleSubmitFeedback = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        try {
            await callAPI('send-platform-help', { feedback: feedback });

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
        <body className="h-[100vh] px-[15vw] bg-gray-100 overflow-x-hidden mx-auto">
            <div className="flex flex-row px-12 h-[13vh] items-center bg-white rounded-b-2xl shadow-custom border-[1px] border-gray">
                <Link href="/home" className="font-bold text-4xl flex items-center">
                    <img
                        src="/openlms.png"
                        alt="OpenLMS Logo"
                        className="h-10 w-auto mr-2"
                    />
                    OpenLMS
                </Link>
                <div className="flex ml-auto text-2xl">
                    <Notifications
                        notifications={notifications}
                        setNotifications={setNotifications}
                        refreshNotifications={getNotifications}
                    />

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

            <div className='flex h-[76vh] mt-[2vh] overflow-scroll rounded-2xl sm:no-scrollbar font-roboto'>
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

            <div
                className="flex items-center px-8 rounded-t-2xl h-20 shadow-custom bg-white border-[1px] border-gray bottom-0"
            >
                <Link href="/home">
                    <img
                        src="/openlms.png"
                        alt="OpenLMS Logo"
                        className="h-6 w-auto mr-2"
                    />
                </Link>

                <Link href="/Learner_Guide.pdf" target="_blank">
                    <div className="rounded-xl text-lg cursor-pointer mx-4 italic">
                        Platform User Guide
                    </div>
                </Link>

                <div className="text-lg italic">
                    |
                </div>

                <div
                    className="rounded-xl text-lg cursor-pointer mx-4 italic"
                    onClick={handleSupportRequest}
                >
                    Technical Support
                </div>

                <span
                    className="text-white ml-auto">&copy; {new Date().getFullYear()} OpenLMS. All rights reserved.
                </span>
            </div>
        </body>
        </html>
    )
}
