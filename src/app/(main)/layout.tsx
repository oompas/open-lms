"use client";
import Link from 'next/link';
import '../globals.css';
import { auth } from '@/config/firebase';
import { useRouter } from "next/navigation";

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

    return (
        <html lang="en">
        <body className="h-[100vh] px-20 bg-gray-100 overflow-x-hidden">
        <div className="flex flex-row px-12 h-[13vh] items-center bg-white rounded-b-2xl shadow-custom">
            <Link href="/home" className="font-bold text-4xl">OpenLMS</Link>
            <div className="flex ml-auto space-x-10 text-2xl">
                <Link href="/profile" className="hover:opacity-50 duration-75">View Profile</Link>
                {/*TODO - conditional rendering for admin-users to see "platform tools" option*/}
                <div onClick={async () => await logout()} className="cursor-pointer hover:opacity-50 duration-75">Log
                    Out
                </div>
            </div>
        </div>
        <div className='flex h-[85vh] mt-[2vh] overflow-scroll rounded-2xl sm:no-scrollbar'>
            {children}
        </div>
        <footer className="flex flex-row justify-center items-center h-16 bg-gray-800 rounded-t-2xl shadow-custom">
            <span className="text-white">&copy; {new Date().getFullYear()} OpenLMS. All rights reserved.</span>
        </footer>
        </body>
        </html>
    )
}
