"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '@/helpers/supabase.ts';

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
        <div>
            <h2>Reset Password</h2>
            {message && <p>{message}</p>}
            <form onSubmit={handleResetPassword}>
                <div>
                    <label htmlFor="newPassword">New Password:</label>
                    <input
                        type="password"
                        id="newPassword"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit">Reset Password</button>
            </form>

            {passwordUpdated && <button onClick={() => router.push('/')}>Sign in</button>}
        </div>
    );
};

export default ResetPasswordPage;
