"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { IoNotifications } from "react-icons/io5";
import { FiTrash } from "react-icons/fi";
import { FaRegNewspaper } from "react-icons/fa6";
import { TbRefresh } from "react-icons/tb";
import { useRouter } from "next/navigation";
import { isToday, isYesterday, isThisWeek, isThisMonth, parseISO } from 'date-fns';
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
    onDelete: (id: string) => void;
    isDeleting: boolean;
    onClose: () => void;
    isLast: boolean;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onDelete, isDeleting, onClose, isLast }) => {
    const router = useRouter();
    const { id, title, date, link, read } = notification;

    return (
        <div className={classNames('mx-4 mt-3', { 'font-bold': !read })}>
            <div>
                <div
                    className="text-sm flex hover:opacity-75 duration-75 cursor-pointer"
                    onClick={() => {
                        onClose();
                        router.push(link);
                    }}
                >
                    <FaRegNewspaper className="w-6 h-6 mt-3 mr-3" />
                    {title}
                </div>

                <div className="text-xs text-gray-500 flex justify-between my-2">
                    {new Date(date).toLocaleString()}
                    <div onClick={() => onDelete(id)}>
                        {isDeleting ? (
                            <TbRefresh className="w-4 h-4 ml-2 animate-spin-counter-clockwise" />
                        ) : (
                            <FiTrash className="w-4 h-4 ml-2 hover:opacity-75 duration-75 cursor-pointer" />
                        )}
                    </div>
                </div>
            </div>

            {!isLast && <div className="border-[1px] rounded-full mt-3" />}
        </div>
    );
};

const Notifications: React.FC = ({ notifications, setNotifications }) => {

    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [loadingNotifications, setLoadingNotifications] = useState(false);
    const [deletingNotificationId, setDeletingNotificationId] = useState<string | null>(null);
    const [deletingAll, setDeletingAll] = useState(false);
    const [directNotifications, setDirectNotifications] = useState(true);

    const popUpRef = useRef<HTMLDivElement>(null);
    const bellIconRef = useRef<SVGElement>(null);

    const refreshNotifications = useCallback(async () => {
        setNotificationsOpen(true);
        setLoadingNotifications(true);
        try {
            const data = await callAPI('get-notifications');
            setNotifications(data.data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoadingNotifications(false);
        }
    }, []);

    const handleIconClick = useCallback(() => {
        if (notificationsOpen) {
            setNotificationsOpen(false);
        } else {
            refreshNotifications();
        }
    }, [notificationsOpen, refreshNotifications]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popUpRef.current?.contains(event.target as Node) === false && bellIconRef.current?.contains(event.target as Node) === false) {
                setNotificationsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => { document.removeEventListener('mousedown', handleClickOutside); };
    }, []);

    const deleteNotification = async (id: string) => {
        setDeletingNotificationId(id);
        try {
            await callAPI('delete-notification', { notificationId: id });
            setNotifications((notifs) => notifs.filter((n) => n.id !== id));
        } catch (error) {
            console.error('Error deleting notification:', error);
        } finally {
            setDeletingNotificationId(null);
        }
    };

    const deleteAllNotifications = async () => {
        setDeletingAll(true);
        try {
            await callAPI('delete-notification', { deleteAll: true });
            setNotifications((notifs) => notifs.filter((n) => n.direct !== directNotifications));
        } catch (error) {
            console.error('Error deleting all notifications:', error);
        } finally {
            setDeletingAll(false);
        }
    };

    const groupedNotifications = React.useMemo(() => {
        const notificationOrder: { [key: string]: Notification[] } = {
            'Today': [],
            'Yesterday': [],
            'This Week': [],
            'This Month': [],
            'Older': []
        };

        const desiredNotifications = notifications.filter((n) => n.direct === directNotifications);

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

        // Sort notifications within each category
        for (const category in notificationOrder) {
            notificationOrder[category].sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
        }

        return notificationOrder;
    }, [notifications, directNotifications]);

    const renderNotifications = () => {
        if (loadingNotifications) {
            return (
                <div className="flex justify-center">
                    <TbRefresh
                        className="mb-4 mt-2 hover:opacity-75 duration-75 cursor-pointer animate-spin-counter-clockwise"
                    />
                </div>
            );
        }

        const hasNotifications = Object.values(groupedNotifications).some(group => group.length > 0);

        if (!hasNotifications) {
            return (
                <div className="flex justify-center">
                    <div className="text-lg font-sans mt-4 text-gray-600">
                        No notifications
                    </div>
                </div>
            );
        }

        return Object.entries(groupedNotifications).map(([timespan, timedNotifications]) => (
            timedNotifications.length > 0 && (
                <React.Fragment key={timespan}>
                    <div className="text-xs font-bold bg-gray-50 w-full px-4 py-2">
                        {timespan.toUpperCase()}
                    </div>
                    {timedNotifications.map((notification, index) => (
                        <NotificationItem
                            key={notification.id}
                            notification={notification}
                            onDelete={deleteNotification}
                            isDeleting={deletingNotificationId === notification.id}
                            onClose={() => setNotificationsOpen(false)}
                            isLast={index === timedNotifications.length - 1}
                        />
                    ))}
                </React.Fragment>
            )
        ));
    };

    return (
        <div className="relative">
            <div ref={bellIconRef}>
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
                                onClick={deleteAllNotifications}
                                disabled={deletingAll}
                            >
                                {deletingAll ? 'Deleting...' : 'Delete all'}
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
