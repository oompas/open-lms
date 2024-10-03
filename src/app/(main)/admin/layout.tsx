"use client";
import { useRouter } from "next/navigation";
import { useSession } from "@supabase/auth-helpers-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {

    const router = useRouter();
    const session = useSession();

    const role = session?.user?.user_metadata?.role;
    if (document.readyState === 'complete' && role !== 'Admin' && role !== 'Developer') {
        router.push('/');
    }

    return (children);
}
