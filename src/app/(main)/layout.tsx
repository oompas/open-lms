"use client";
import Link from 'next/link';
import '../globals.css';
import { auth } from '@/config/firebase';
import { useRouter } from "next/navigation";
import { useState, useEffect } from 'react';

export default function LearnerLayout({
   children,
}: {
    children: React.ReactNode
}) {

    const router = useRouter();

    const logout = async () => {
        await auth.signOut();
        router.push('/');
    }

    const useAdminStatus = () => {
        const [isAdmin, setIsAdmin] = useState(false);
        useEffect(() => {
            auth.currentUser?.getIdTokenResult()
                .then((idTokenResult) => {
                    // Confirm the user is an Admin.
                    setIsAdmin(!!idTokenResult.claims.admin);
                })
                .catch((error) => {
                    console.log(error);
                });
        }, []);
        return isAdmin;
    };
    const isAdmin = useAdminStatus();

    return (
        <html lang="en">
            <body className="h-[100vh] px-20 bg-gray-100 overflow-x-hidden">
                <div className="flex flex-row px-12 h-[13vh] items-center bg-white rounded-b-2xl shadow-custom">
                    <Link href="/home" className="font-bold text-4xl">OpenLMS</Link>
                    <div className="flex ml-auto space-x-10 text-2xl">
                        {isAdmin && <Link href="/admin/tools" className="hover:opacity-50 duration-75">Admin Tools</Link>}
                        <Link href="/profile" className="hover:opacity-50 duration-75">View Profile</Link>
                        <div onClick={async () => await logout()} className="cursor-pointer hover:opacity-50 duration-75">Log Out</div>
                    </div>
                </div>
                <div className='flex h-[85vh] mt-[2vh] overflow-scroll rounded-2xl sm:no-scrollbar'>
                    {children}
                </div>
            </body>
        </html>
    )
}
