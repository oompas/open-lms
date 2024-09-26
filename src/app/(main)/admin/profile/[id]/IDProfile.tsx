"use client";
import Button from "@/components/Button"
import { ApiEndpoints, callApi } from "@/config/firebase";
import { useState } from "react";

export default function IDProfile({
    name,
    signUpDate,
    lastActiveTime,
    email,
    uid,
    disabled
} : {
    name: string,
    signUpDate: number,
    lastActiveTime: number,
    email: string,
    uid: string,
    disabled: boolean
}) {

    const [isDisabled, setIsDisabled] = useState(disabled);

    const handleUpdateUserEnabled = async () => {
        await callApi(ApiEndpoints.UpdateUserEnabled, { targetUid: uid })
            .then(() => setIsDisabled(!isDisabled))
    }

    return (
        <div className="flex flex-col h-full">
            <div className="text-2xl font-bold mt-2">{name}</div>
            <div className="flex flex-col h-full items-end mb-auto">
                <div className="mr-auto text-lg mb-4">{email}</div>
                <div className="mr-auto text-lg">Signed up: <i>{signUpDate}</i></div>
                <div className="mr-auto text-lg mb-4">Last Updated: <i>{lastActiveTime}</i></div>
            </div>
            <Button
                text={`${isDisabled ? "Enable" : "Disable"} User Account`}
                onClick={async () => await handleUpdateUserEnabled()}
            />
        </div>
    )
}
