"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";

export default function LeaveApprovalsPage() {
    const [requests, setRequests] = useState<any[]>([]);
    const [exceptions, setExceptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [exLoading, setExLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        fetchRequests();
        fetchExceptions();
    }, []);

    const fetchRequests = async () => {
        try {
            const res = await fetch("/api/leaves/approvals");
            const json = await res.json();
            setRequests(json);
        } catch (err) {
            console.error("Failed to load requests", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchExceptions = async () => {
        try {
            const res = await fetch("/api/attendance/exception");
            if (res.ok) {
                const json = await res.json();
                setExceptions(json);
            }
        } catch (err) {
            console.error("Failed to load exceptions", err);
        } finally {
            setExLoading(false);
        }
    };

    const handleAction = async (requestId: string, status: 'APPROVED' | 'REJECTED') => {
        setProcessingId(requestId);
        try {
            const res = await fetch("/api/leaves/approvals", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ requestId, status }),
            });
            if (!res.ok) throw new Error("Failed to update status");
            setRequests(requests.filter((r: any) => r.id !== requestId));
        } catch (err) {
            console.error("Error updating leave request", err);
            alert("Failed to process request. Please try again.");
        } finally {
            setProcessingId(null);
        }
    };

    const handleExceptionAction = async (exceptionId: string, status: 'APPROVED' | 'REJECTED') => {
        setProcessingId(exceptionId);
        try {
            const res = await fetch(`/api/attendance/exception/${exceptionId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            if (!res.ok) throw new Error("Failed to update exception status");
            setExceptions(exceptions.filter((e: any) => e.id !== exceptionId));
        } catch (err) {
            console.error("Error processing exception request", err);
            alert("Failed to process exception. Please try again.");
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Approvals</h1>
                <p className="mt-1 text-sm text-gray-500">Review and manage pending time off and attendance exception requests from your team.</p>
            </div>

            {/* ── Leave Requests ───────────────────────────── */}
            <div>
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">Leave Requests</h2>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center text-gray-500 animate-pulse">Loading pending requests...</div>
                    ) : requests.length === 0 ? (
                        <div className="p-12 text-center flex flex-col items-center justify-center">
                            <svg className="w-12 h-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 13l4 4L19 7" /></svg>
                            <p className="text-gray-900 font-medium text-lg">You're all caught up!</p>
                            <p className="text-gray-500 text-sm mt-1">No pending leave requests require your attention right now.</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {requests.map((req: any) => (
                                <li key={req.id} className="p-6 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 min-w-[40px] rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold uppercase">
                                                {req.employee?.firstName?.[0]}{req.employee?.lastName?.[0]}
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-gray-900">{req.employee?.firstName} {req.employee?.lastName}</h3>
                                                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mt-0.5">{req.leaveType?.name}</p>
                                            </div>
                                        </div>
                                        <div className="mt-4 sm:ml-13">
                                            <div className="flex items-center text-sm text-gray-700 gap-1.5 font-medium">
                                                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                {format(new Date(req.startDate), 'MMM d, yyyy')} - {format(new Date(req.endDate), 'MMM d, yyyy')}
                                            </div>
                                            {req.reason && (
                                                <p className="mt-2 text-sm text-gray-600 bg-gray-100/50 p-3 rounded-lg flex items-start gap-2 border border-gray-200/50">
                                                    <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                    <span className="italic">{req.reason}</span>
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex shrink-0 gap-3 w-full sm:w-auto mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                                        <button onClick={() => handleAction(req.id, 'REJECTED')} disabled={processingId === req.id} className="flex-1 sm:flex-none px-4 py-2 border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50">Reject</button>
                                        <button onClick={() => handleAction(req.id, 'APPROVED')} disabled={processingId === req.id} className="flex-1 sm:flex-none px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors disabled:opacity-50">
                                            {processingId === req.id ? 'Loading...' : 'Approve'}
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* ── Attendance Exception Requests ─────────────── */}
            <div>
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">Attendance Exception Requests</h2>
                <div className="bg-white rounded-2xl shadow-sm border border-amber-100 overflow-hidden">
                    {exLoading ? (
                        <div className="p-8 text-center text-gray-500 animate-pulse">Loading exception requests...</div>
                    ) : exceptions.length === 0 ? (
                        <div className="p-10 text-center flex flex-col items-center justify-center">
                            <svg className="w-10 h-10 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 13l4 4L19 7" /></svg>
                            <p className="text-gray-600 font-medium">No pending exception requests.</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {exceptions.map((ex: any) => (
                                <li key={ex.id} className="p-6 hover:bg-amber-50/30 transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 min-w-[40px] rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold uppercase">
                                                {ex.employee?.firstName?.[0]}{ex.employee?.lastName?.[0]}
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-gray-900">{ex.employee?.firstName} {ex.employee?.lastName}</h3>
                                                <p className="text-xs text-amber-600 font-semibold uppercase tracking-wider mt-0.5">Missed Punch — Attendance Exception</p>
                                            </div>
                                        </div>
                                        <div className="mt-3 ml-13 flex flex-col gap-1">
                                            <div className="flex items-center text-sm text-gray-700 gap-1.5 font-medium">
                                                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                {format(new Date(ex.date), 'EEEE, MMMM d, yyyy')}
                                            </div>
                                            {ex.reason && (
                                                <p className="text-sm text-gray-600 bg-amber-50 p-2.5 rounded-lg border border-amber-100 flex items-start gap-2 italic mt-1">
                                                    <svg className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                    {ex.reason}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex shrink-0 gap-3 w-full sm:w-auto mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                                        <button onClick={() => handleExceptionAction(ex.id, 'REJECTED')} disabled={processingId === ex.id} className="flex-1 sm:flex-none px-4 py-2 border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50">Reject</button>
                                        <button onClick={() => handleExceptionAction(ex.id, 'APPROVED')} disabled={processingId === ex.id} className="flex-1 sm:flex-none px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors disabled:opacity-50">
                                            {processingId === ex.id ? 'Approving...' : 'Approve Exception'}
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
