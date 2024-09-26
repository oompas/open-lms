"use client";
import Button from "@/components/Button"
import { useState } from "react";
import { callAPI } from "@/config/supabase.ts";
import StatusBadge from "@/components/StatusBadge.tsx";

export default function IDProfile({
    name,
    role,
    signUpDate,
    lastUpdatedTime,
    email,
    uid,
    disabled
} : {
    name: string,
    role: string,
    signUpDate: number,
    lastUpdatedTime: number,
    email: string,
    uid: string,
    disabled: boolean
}) {

    const [isDisabled, setIsDisabled] = useState(disabled);
    const [showDeactivatePopup, setShowDeactivatePopup] = useState(false);

    const handleUpdateUserEnabled = async () => {
        await callAPI('disable-user', { userId: uid, disable: !isDisabled })
            .then(() => setIsDisabled(!isDisabled));
    }

    const deactivatePopup = (
        <div
            className="fixed flex justify-center items-center w-[100vw] h-[100vh] top-0 left-0 bg-white bg-opacity-50">
            <div className="flex flex-col w-1/2 bg-white p-12 rounded-xl text-lg shadow-xl">
                <div className="text-lg mb-2">
                    <b>Deactivate user?</b>
                    {isDisabled ? (
                        <p className="mt-2">
                            Enable the account of '{name}' ({email})? They will be abl to sign in and access the site again
                        </p>
                    )
                    : (
                        <>
                            <p className="mt-2">
                                This will deactivate the account of '{name}' ({email}), signing them out and blocking them
                                from signing in until they are re-activated
                            </p>
                            <p className="mt-2">
                                All of their data will be kept as is, and they can be re-activated at any time through
                                this same page
                            </p>
                        </>
                    )}
                </div>
                <div className="flex flex-row space-x-4 mt-6">
                    <Button text="Cancel" onClick={() => setShowDeactivatePopup(false)} style="ml-auto"/>
                    <Button
                        text={isDisabled ? "Enable" : "Disable"}
                        onClick={async () => await handleUpdateUserEnabled()}
                        filled
                    />
                </div>
            </div>
        </div>
    );

    return (
        <>
            <div className="flex flex-col h-full">
                <StatusBadge status={role} style="my-1"/>
                <div className="text-2xl font-bold mt-2">{name}</div>
                <div className="flex flex-col h-full items-end mb-auto">
                    <div className="mr-auto text-lg mb-4">{email}</div>
                    <div className="mr-auto text-lg">Signed up: <i>{signUpDate}</i></div>
                    <div className="mr-auto text-lg mb-4">Last Updated: <i>{lastUpdatedTime}</i></div>
                </div>
                {role === "Learner" && (
                    <Button
                        text={`${isDisabled ? "Enable" : "Disable"} User Account`}
                        onClick={() => setShowDeactivatePopup(true)}
                    />
                )}
            </div>
            { showDeactivatePopup && deactivatePopup }
        </>
    )
}
