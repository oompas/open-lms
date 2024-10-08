"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { IoNotifications } from "react-icons/io5";
import { FaRegNewspaper } from "react-icons/fa6";
import { useRouter } from "next/navigation";
import {
    parseISO,
    isToday,
    isThisWeek,
    isThisMonth,
    isThisYear,
    differenceInSeconds,
    differenceInMinutes,
    differenceInHours,
    differenceInDays,
    differenceInWeeks,
    differenceInMonths,
    differenceInYears } from 'date-fns';
import classNames from 'classnames';
import { callAPI } from "@/helpers/supabase.ts";

interface Notification {
    id: string;
    title: string;
    date: string;
    link: string;
    direct: boolean;
    read: boolean;
}

interface NotificationItemProps {
    notification: Notification;
    onClose: () => void;
    isLast: boolean;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, readNotification, onClose, isLast }) => {
    const router = useRouter();
    const { id, title, date, link, read } = notification;

    return (
        <div className={classNames('mx-4 mt-3', { 'font-bold': !read })}>
            <div>
                <div
                    className="text-sm flex hover:opacity-75 duration-75 cursor-pointer"
                    onClick={() => {
                        if (!read) {
                            readNotification(id);
                        }
                        onClose();
                        router.push(link);
                    }}
                >
                    <FaRegNewspaper className="w-7 h-7 mt-2 mr-3" />
                    {title}
                </div>

                <div className="text-xs text-gray-500 flex justify-between my-2">
                    {date}
                </div>
            </div>

            {!isLast && <div className="border-[1px] rounded-full mt-3" />}
        </div>
    );
};

const Notifications: React.FC = ({ notifications, setNotifications, refreshNotifications }) => {

    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [directNotifications, setDirectNotifications] = useState(true);

    const popUpRef = useRef<HTMLDivElement>(null);
    const bellIconRef = useRef<SVGElement>(null);

    const handleIconClick = useCallback(() => {
        setNotificationsOpen(!notificationsOpen);
    }, [notificationsOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popUpRef.current?.contains(event.target as Node) === false && bellIconRef.current?.contains(event.target as Node) === false) {
                setNotificationsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => { document.removeEventListener('mousedown', handleClickOutside); };
    }, []);

    const readNotification = async (id: string) => {
        try {
            await callAPI('read-notification', { notificationId: id });
            refreshNotifications();
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const readAllNotifications = async () => {
        try {
            await callAPI('read-notification', { readAll: true });
            refreshNotifications();
        } catch (error) {
            console.error('Error deleting all notifications:', error);
        }
    };

    const renderNotifications = () => {

        const filteredNotifications = notifications.filter((n) => n.direct === directNotifications).map((notification, index) => {
            return (
                <NotificationItem
                    key={notification.id}
                    notification={notification}
                    readNotification={readNotification}
                    onClose={() => setNotificationsOpen(false)}
                    isLast={index === notifications.length - 1}
                />
            );
        });

        if (filteredNotifications.length === 0) {
            return (
                <div className="flex justify-center">
                    <div className="text-lg font-sans mt-4 text-gray-600">
                        No notifications
                    </div>
                </div>
            );
        }

        return filteredNotifications;
    };

    return (
        <div className="relative">
            <div ref={bellIconRef}>
                {notifications && notifications.some((n) => !n.read) &&
                    <div className={"absolute rounded-full bg-cyan-800 w-2 h-2 right-[1px] top-[1px]"}></div>
                }
                <IoNotifications
                    className="mt-[6px] hover:opacity-75 duration-75 cursor-pointer"
                    onClick={handleIconClick}
                />
            </div>
            {notificationsOpen && (
                <div
                    ref={popUpRef}
                    className="absolute right-0 mt-2 w-72 h-72 bg-white shadow-lg rounded-lg border-gray-300 border-[1px] overflow-y-scroll no-scrollbar"
                >
                    <div className="mb-2 mx-4">
                        <div className="text-lg font-semibold mt-4 text-gray-600">
                            Notifications
                        </div>
                        <div className="flex justify-between mt-3">
                            <div className="flex gap-4">
                                <button
                                    className={classNames(
                                        'text-sm font-medium py-1',
                                        directNotifications
                                            ? 'text-blue-600 border-b-2 border-blue-600'
                                            : 'text-gray-600 hover:text-gray-900'
                                    )}
                                    onClick={() => setDirectNotifications(true)}
                                >
                                    Direct
                                </button>
                                <button
                                    className={classNames(
                                        'text-sm font-medium py-1',
                                        !directNotifications
                                            ? 'text-blue-600 border-b-2 border-blue-600'
                                            : 'text-gray-600 hover:text-gray-900'
                                    )}
                                    onClick={() => setDirectNotifications(false)}
                                >
                                    Other
                                </button>
                            </div>
                            <button
                                className="text-sm text-blue-600 hover:text-blue-800"
                                onClick={readAllNotifications}
                            >
                                Mark all as read
                            </button>
                        </div>
                    </div>

                    {renderNotifications()}
                </div>
            )}
        </div>
    );
};

export default Notifications;
