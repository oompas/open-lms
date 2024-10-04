"use client";
import { useRouter } from "next/navigation";
import { useSession } from "@supabase/auth-helpers-react";
import { useEffect } from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {

    const router = useRouter();
    const session = useSession();

    // Route user back to learner homepage if they're not an admin/dev
    useEffect(() => {
        if (typeof window !== 'undefined' && document.readyState === 'complete') {
            const role = session?.user?.user_metadata?.role;
            if (role !== 'Admin' && role !== 'Developer') {
                router.push('/');
            }
        }
    }, [session, router]);

    return (children);
}
