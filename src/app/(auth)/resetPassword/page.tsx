"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '@/helpers/supabase.ts';
import Button from "@/components/Button.tsx";

const ResetPasswordPage = () => {
    const [newPassword, setNewPassword] = useState('');
    const [message, setMessage] = useState('');
    const [passwordUpdated, setPasswordUpdated] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get('access_token');

        if (!accessToken) {
            setMessage('Invalid or expired token.');
        }
    }, []);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        setMessage('');

        if (!newPassword) {
            setMessage('Please enter a new password.');
            return;
        }

        try {
            const { error } = await supabaseClient.auth.updateUser({
                password: newPassword,
            });

            if (error) {
                setMessage(`There was an error updating your password: ${error.message}`);
            } else {
                setMessage('Password updated successfully!');

                // Signs out user to force a sign in with the new password
                const { error } = await supabaseClient.auth.signOut();
                if (error) {
                    console.log(`Error signing out user: ${error.message}`);
                }

                setPasswordUpdated(true);
            }
        } catch (err) {
            setMessage('An unexpected error occurred.');
            console.error('Error updating password:', err);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
                <img
                    src="/openlms.png"
                    alt="OpenLMS Logo"
                    className="w-1/5 mx-auto mb-4"
                />
                <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800">Reset Password</h2>
                {message && (
                    <div
                        className={`mb-4 p-3 rounded ${passwordUpdated ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {message}
                    </div>
                )}
                <form onSubmit={handleResetPassword} className="space-y-4">
                    <div>
                        <label htmlFor="newPassword" className="block text-gray-700 text-sm font-bold mb-2">
                            New Password:
                        </label>
                        <input
                            type="password"
                            id="newPassword"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        />
                    </div>
                    <div className="flex justify-between">
                        <Button text={"Cancel"} icon="arrow-back" iconBefore/>
                        <Button text={"Reset Password"} filled style=""/>
                    </div>
                </form>

                {passwordUpdated && (
                    <button
                        onClick={() => router.push('/')}
                        className="mt-4 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
                    >
                        Sign in
                    </button>
                )}
            </div>
        </div>
    );
};

export default ResetPasswordPage;
