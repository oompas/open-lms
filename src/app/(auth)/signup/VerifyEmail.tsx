import React from 'react';
import Button from "@/components/Button";

// @ts-ignore
const VerifyEmailPopup = ({ onClose }) => {
    return (
        <div className="fixed flex justify-center items-center w-screen h-screen top-0 left-0 bg-gray-900 bg-opacity-50 z-50">
            <div className="bg-white p-8 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-4">Verify Your Email</h2>
                <p className="text-lg mb-4">Thank you for creating an account! Please verify your email address before logging in.</p>
                <Button text="Close" onClick={onClose} />
            </div>
        </div>
    );
};

export default VerifyEmailPopup;