"use client";
import React, { useState, useEffect, useRef } from 'react';
import { IoNotifications } from "react-icons/io5";
import { FiTrash } from "react-icons/fi";
import { FaRegNewspaper } from "react-icons/fa6";
import { TbRefresh } from "react-icons/tb";
import { callAPI } from "@/config/supabase.ts";
import { useRouter } from "next/navigation";
import { isToday, isYesterday, isThisWeek, isThisMonth, parseISO } from 'date-fns';

export default function Notifications() {
    const router = useRouter();

    const [notifications, setNotifications] = useState([]);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [loadingNotifications, setLoadingNotifications] = useState(false);
    const [directNotifications, setDirectNotifications] = useState(true);
    const popUpRef = useRef(null);
    const popUpBellRef = useRef(null);

    const refreshNotifications = async () => {
        setLoadingNotifications(true);
        setNotificationsOpen(true);
        try {
            const data = await callAPI('get-notifications');
            setNotifications(data.data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoadingNotifications(false);
        }
    };

    // Toggle pop-up on icon click
    const handleIconClick = async () => {
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
    }, [popUpRef]);

    const deleteNotification = async (id) => {
        setLoadingNotifications(id);
        try {
            await callAPI('delete-notification', { notificationIds: id });
            setNotifications((notifs) => notifs.filter((n) => n.id !== id));
        } catch (error) {
            console.error('Error deleting notification:', error);
        } finally {
            setLoadingNotifications(false);
        }
    };

    const renderNotifications = () => {
        if (loadingNotifications === true) {
            return null;
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
            if (timedNotifications.length === 0) continue;

            response.push(
                <div className="text-xs font-bold bg-gray-50 w-full px-4 py-2" key={timespan}>
                    {timespan.toUpperCase()}
                </div>
            );

            timedNotifications.forEach((notification, index) => {
                const last = index === timedNotifications.length - 1;
                response.push(
                    <div key={notification.id} className={`mx-4 mt-3 ${notification.read ? '' : 'font-bold'}`}>
                        <div>
                            <div
                                className="text-sm flex hover:opacity-75 duration-75 cursor-pointer"
                                onClick={() => {
                                    setNotificationsOpen(false);
                                    router.push(notification.link);
                                }}
                            >
                                <FaRegNewspaper className="w-6 h-6 mt-3 mr-3" />
                                {notification.title}
                            </div>

                            <div className="text-xs text-gray-500 flex justify-between my-2">
                                {new Date(notification.date).toLocaleString()}
                                <div onClick={() => deleteNotification(notification.id)}>
                                    {loadingNotifications === notification.id ? (
                                        <TbRefresh className="w-4 h-4 ml-2 animate-spin-counter-clockwise" />
                                    ) : (
                                        <FiTrash className="w-4 h-4 ml-2 hover:opacity-75 duration-75 cursor-pointer" />
                                    )}
                                </div>
                            </div>
                        </div>

                        {!last && <div className="border-[1px] rounded-full mt-3" />}
                    </div>
                );
            });
        }

        return response;
    };

    return (
        <div className="relative">
            <IoNotifications
                ref={popUpBellRef}
                className="mt-[6px] hover:opacity-75 duration-75 cursor-pointer"
                onClick={handleIconClick}
            />
            {notificationsOpen && (
                <div
                    ref={popUpRef}
                    className="absolute right-0 mt-2 w-72 h-72 font-sans bg-white shadow-lg rounded-lg border-gray-300 border-[1px] overflow-y-scroll no-scrollbar"
                >
                    <div className="mb-2 mx-4">
                        <div className="flex justify-between items-center">
                            <div className="text-lg font-semibold mt-4">Notifications</div>
                        </div>
                        <div className="flex justify-between mt-3">
                            <div className="flex gap-4">
                                <button
                                    className={`text-sm font-medium ${
                                        directNotifications
                                            ? 'text-blue-600 border-b-2 border-blue-600'
                                            : 'text-gray-700 hover:text-gray-900'
                                    } py-1`}
                                    onClick={() => setDirectNotifications(true)}
                                >
                                    Direct
                                </button>
                                <button
                                    className={`text-sm font-medium ${
                                        directNotifications
                                            ? 'text-gray-700 hover:text-gray-900'
                                            : 'text-blue-600 border-b-2 border-blue-600'
                                    } py-1`}
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
                                className="mb-4 mt-2 hover:opacity-75 duration-75 cursor-pointer animate-spin-counter-clockwise"
                            />
                        </div>
                    )}

                    {renderNotifications()}
                </div>
            )}
        </div>
    );
}
