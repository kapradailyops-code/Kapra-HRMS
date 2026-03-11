"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useToast } from "../components/ToastProvider";

export default function ClockInOut() {
    const { showToast } = useToast();
    const [record, setRecord] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        try {
            const res = await fetch("/api/attendance");
            if (res.ok) {
                const data = await res.json();
                setRecord(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (action: 'CLOCK_IN' | 'CLOCK_OUT') => {
        setActionLoading(true);
        try {
            const res = await fetch("/api/attendance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action })
            });
            if (res.ok) {
                const updated = await res.json();
                setRecord(updated);
                showToast(action === 'CLOCK_IN' ? 'Clocked in successfully!' : 'Clocked out. Have a great day!', 'success');
            } else {
                const errText = await res.text();
                showToast(errText || 'Something went wrong.', 'error');
            }
        } catch (error) {
            console.error(error);
            showToast('Failed to process attendance action.', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return <div className="animate-pulse bg-gray-100 h-24 rounded-xl"></div>;
    }

    const isClockedIn = record && record.clockIn && !record.clockOut;
    const isClockedOut = record && record.clockOut;

    return (
        <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white flex flex-col justify-between h-full relative overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-indigo-900/20 rounded-full blur-xl"></div>

            <div className="relative z-10 flex items-start justify-between">
                <div>
                    <h3 className="text-lg font-bold tracking-tight text-white mb-1">Attendance</h3>
                    <p className="text-indigo-100 text-sm font-medium">{format(new Date(), 'EEEE, MMMM d')}</p>
                </div>
                <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
            </div>

            <div className="relative z-10 mt-6 pt-6 border-t border-indigo-400/30 flex items-center justify-between">
                <div>
                    {isClockedOut ? (
                        <div>
                            <p className="text-xs uppercase tracking-wider text-indigo-200 font-semibold mb-1">Status</p>
                            <p className="text-sm font-bold text-white flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-gray-300"></span> Shift Ended
                            </p>
                            <p className="text-xs text-indigo-100 mt-1">{format(new Date(record.clockOut), 'h:mm a')}</p>
                        </div>
                    ) : isClockedIn ? (
                        <div>
                            <p className="text-xs uppercase tracking-wider text-indigo-200 font-semibold mb-1">Status</p>
                            <p className="text-sm font-bold text-white flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span> Clocked In
                            </p>
                            <p className="text-xs text-indigo-100 mt-1">Since {format(new Date(record.clockIn), 'h:mm a')}</p>
                        </div>
                    ) : (
                        <div>
                            <p className="text-xs uppercase tracking-wider text-indigo-200 font-semibold mb-1">Status</p>
                            <p className="text-sm font-bold text-white flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-yellow-400"></span> Not Started
                            </p>
                        </div>
                    )}
                </div>

                <div>
                    {isClockedOut ? (
                        <button disabled className="px-5 py-2.5 bg-white/20 text-white rounded-lg text-sm font-bold cursor-not-allowed border border-white/10">
                            Done for Today
                        </button>
                    ) : isClockedIn ? (
                        <button
                            onClick={() => handleAction('CLOCK_OUT')}
                            disabled={actionLoading}
                            className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-bold shadow-md transition-colors disabled:opacity-50 border border-red-400 hover:border-red-500"
                        >
                            {actionLoading ? 'Processing...' : 'Clock Out'}
                        </button>
                    ) : (
                        <button
                            onClick={() => handleAction('CLOCK_IN')}
                            disabled={actionLoading}
                            className="px-5 py-2.5 bg-white text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-bold shadow-md transition-colors disabled:opacity-50"
                        >
                            {actionLoading ? 'Processing...' : 'Clock In'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
