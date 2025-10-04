'use client';

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function ChipCounter({ chips }: { chips: number }) {
    const { user, token, updateChips } = useAuth();
    const [amount, setAmount] = useState<string>('');
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

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
            // Use current chips from user context, not prop
            const newChips = user.chips + numAmount;

            const response = await fetch('/api/update-chips', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, chips: newChips }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Failed to add chips');
                setLoading(false);
                return;
            }

            // Update chips in auth context immediately
            updateChips(newChips);

            setAmount('');
            setShowModal(false);
            setLoading(false);
        } catch (err) {
            setError('An error occurred');
            setLoading(false);
        }
    };

    const openModal = () => {
        if (!user) {
            setError('Please login to add chips');
            setTimeout(() => setError(''), 3000);
            return;
        }
        setShowModal(true);
        setError('');
    };

    return (
        <>
            <button
                onClick={openModal}
                className="flex items-center bg-yellow-500 text-black text-sm px-3 py-1 rounded-full hover:bg-yellow-400 transition-colors duration-200"
            >
                <span className="mr-2">{user ? user.chips : chips}</span>
                <span className="font-bold">+</span>
            </button>

            {error && !showModal && (
                <div className="fixed top-20 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded z-50">
                    {error}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4 text-black">Add Chips</h2>

                        {error && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">
                                {error}
                            </div>
                        )}

                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2 text-black">
                                Amount to add:
                            </label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="Enter amount"
                                className="w-full px-3 py-2 border rounded text-black"
                                min="1"
                                disabled={loading}
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleAddChips}
                                disabled={loading}
                                className="flex-1 bg-yellow-500 text-black px-4 py-2 rounded hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Adding...' : 'Add Chips'}
                            </button>
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    setAmount('');
                                    setError('');
                                }}
                                disabled={loading}
                                className="flex-1 bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
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