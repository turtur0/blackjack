'use client';

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface ChipCounterProps {
    chips: number;
}

export default function ChipCounter({ chips }: ChipCounterProps) {
    const { user, token, updateChips, refreshUser } = useAuth();
    const [amount, setAmount] = useState<string>('');
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const displayChips = user?.chips ?? chips;

    const resetModalState = () => {
        setAmount('');
        setError('');
        setSuccess(false);
    };

    const openModal = () => {
        if (!user) {
            setError('Please login to add chips');
            setTimeout(() => setError(''), 3000);
            return;
        }
        setShowModal(true);
        resetModalState();
    };

    const closeModal = () => {
        setShowModal(false);
        resetModalState();
    };

    const handleAddChips = async () => {
        if (!user || !token) {
            setError('Please login to add chips');
            return;
        }

        const numAmount = parseInt(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const newChips = user.chips + numAmount;

            const response = await fetch('/api/update-chips', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, chips: newChips, userId: user.id }),
            });

            if (!response.ok) {
                const data = await response.json();
                setError(data.error || 'Failed to add chips');
                return;
            }

            updateChips(newChips);
            await refreshUser();

            setSuccess(true);
            setTimeout(() => {
                closeModal();
            }, 1500);
        } catch (err) {
            console.error('Error adding chips:', err);
            setError('An error occurred while adding chips');
        } finally {
            setLoading(false);
        }
    };

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            closeModal();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !loading && !success && amount) {
            handleAddChips();
        }
    };

    return (
        <>
            <button
                onClick={openModal}
                className="flex items-center bg-yellow-500 text-black text-sm px-3 py-1 rounded-full hover:bg-yellow-400 transition-colors duration-200"
            >
                <span className="mr-2">{displayChips}</span>
                <span className="font-bold">+</span>
            </button>

            {error && !showModal && (
                <div className="fixed top-20 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded z-50 shadow-lg">
                    {error}
                </div>
            )}

            {showModal && (
                <div
                    className="fixed inset-0 flex items-center justify-center z-50"
                    onClick={handleBackdropClick}
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
                >
                    <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
                        <h2 className="text-xl font-bold mb-4 text-black">Add Chips</h2>

                        {error && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded mb-4">
                                Chips added successfully!
                            </div>
                        )}

                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2 text-black">
                                Current chips: <strong>{user?.chips || 0}</strong>
                            </label>
                            <label className="block text-sm font-medium mb-2 text-black">
                                Amount to add:
                            </label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Enter amount"
                                className="w-full px-3 py-2 border rounded text-black bg-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                min="1"
                                disabled={loading || success}
                                autoFocus
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleAddChips}
                                disabled={loading || success || !amount}
                                className="flex-1 bg-yellow-500 text-black px-4 py-2 rounded hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                            >
                                {loading ? 'Adding...' : success ? 'Added!' : 'Add Chips'}
                            </button>
                            <button
                                onClick={closeModal}
                                disabled={loading}
                                className="flex-1 bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
