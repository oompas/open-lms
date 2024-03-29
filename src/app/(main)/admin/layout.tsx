"use client";

import { auth } from '@/config/firebase';
import { useRouter } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {

    const router = useRouter();

    // if user is Learner - go to home
    auth.onAuthStateChanged((user) => {
        if (user) {
            auth.currentUser?.getIdTokenResult()
                .then((idTokenResult) => !idTokenResult.claims.admin ? router.replace("/home") : null)
                .catch((error) => console.log(`Error fetching user ID token: ${error}`));
        }
    });

    return (children)
}
