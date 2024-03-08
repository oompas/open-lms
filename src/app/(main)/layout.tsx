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
            <body className="h-[100vh] px-24 bg-gray-100 overflow-x-hidden">
                <div className="flex flex-row px-12 h-32 items-center bg-white rounded-b-2xl shadow-custom">
                    <Link href="/home" className="font-bold text-4xl">OpenLMS</Link>
                    <div className="flex ml-auto space-x-10 text-2xl">
                        <Link href="/profile">View Profile</Link>
                        {/*TODO - conditional rendering for admin-users to see "platform tools" option*/}
                        <div onClick={async () => await logout()}>Log Out</div>
                    </div>
                </div>
                {children}
            </body>
        </html>
    )
}
