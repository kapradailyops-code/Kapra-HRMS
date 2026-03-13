"use client";

import { useState, useEffect } from "react";

type AnalyticsData = {
    totalActive: number;
    headcountByDept: { name: string; count: number }[];
    headcountByType: { type: string; count: number }[];
    leaveLiabilityDays: number;
    leavesByStatus: { status: string; count: number }[];
    topLeaveTypes: { name: string; count: number }[];
};

const STATUS_COLORS: Record<string, string> = {
    APPROVED: "bg-green-500",
    PENDING: "bg-yellow-500",
    REJECTED: "bg-red-500",
    CANCELLED: "bg-gray-400",
};

export default function AnalyticsDashboard() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [pendingDeletions, setPendingDeletions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            fetch("/api/analytics").then(r => r.json()),
            fetch("/api/employees/pending-deletions").then(r => r.json())
        ])
        .then(([analyticsData, deletionsData]) => {
            setData(analyticsData);
            setPendingDeletions(deletionsData);
            setLoading(false);
        })
        .catch(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="h-8 w-48 bg-gray-200 animate-pulse rounded-lg"></div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <div key={i} className="h-28 bg-gray-100 animate-pulse rounded-2xl"></div>)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-2xl"></div>)}
                </div>
            </div>
        );
    }

    if (!data) return <div className="text-center text-gray-500 py-12">Failed to load analytics data.</div>;

    const maxDeptCount = Math.max(...data.headcountByDept.map(d => d.count), 1);
    const maxLeaveCount = Math.max(...data.topLeaveTypes.map(l => l.count), 1);

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Analytics & Reporting</h1>
                <p className="mt-1 text-sm text-gray-500">A high-level overview of workforce and leave data.</p>
            </div>

            {pendingDeletions.length > 0 && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">Pending Employee Terminations</h3>
                            <div className="mt-2 text-sm text-red-700">
                                <p>There are {pendingDeletions.length} terminated employees whose retained data has expired (older than 3 months).</p>
                                <ul className="list-disc pl-5 mt-1 space-y-1">
                                    {pendingDeletions.slice(0, 3).map((emp) => (
                                        <li key={emp.id}>{emp.firstName} {emp.lastName} ({emp.employeeId})</li>
                                    ))}
                                    {pendingDeletions.length > 3 && (
                                        <li>...and {pendingDeletions.length - 3} more.</li>
                                    )}
                                </ul>
                                <p className="mt-2 text-xs opacity-80">A hard-delete process or cron job should be initiated to clear out these records.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Top KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-md">
                    <p className="text-sm font-semibold text-blue-100 uppercase tracking-wider">Total Active Staff</p>
                    <p className="text-5xl font-extrabold mt-2">{data.totalActive}</p>
                    <p className="text-blue-200 text-sm mt-1">Across all departments</p>
                </div>
                <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-6 text-white shadow-md">
                    <p className="text-sm font-semibold text-amber-100 uppercase tracking-wider">Leave Liability</p>
                    <p className="text-5xl font-extrabold mt-2">{data.leaveLiabilityDays.toFixed(0)}</p>
                    <p className="text-amber-100 text-sm mt-1">Total days outstanding</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-6 text-white shadow-md">
                    <p className="text-sm font-semibold text-purple-100 uppercase tracking-wider">Total Requests</p>
                    <p className="text-5xl font-extrabold mt-2">{data.leavesByStatus.reduce((s, i) => s + i.count, 0)}</p>
                    <p className="text-purple-200 text-sm mt-1">Leave requests submitted</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Headcount by Department */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6">Headcount by Department</h2>
                    {data.headcountByDept.length === 0 ? (
                        <p className="text-sm text-gray-400 italic">No departments configured yet.</p>
                    ) : (
                        <div className="space-y-4">
                            {data.headcountByDept.map(d => (
                                <div key={d.name}>
                                    <div className="flex justify-between text-sm mb-1.5">
                                        <span className="font-medium text-gray-700 truncate">{d.name}</span>
                                        <span className="font-bold text-gray-900 tabular-nums">{d.count}</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                                        <div className="bg-blue-500 h-2.5 rounded-full transition-all duration-700" style={{ width: `${(d.count / maxDeptCount) * 100}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Leave Request Status Breakdown */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6">Leave Request Status</h2>
                    {data.leavesByStatus.length === 0 ? (
                        <p className="text-sm text-gray-400 italic">No leave requests on record.</p>
                    ) : (
                        <div className="space-y-4">
                            {data.leavesByStatus.map(s => {
                                const total = data.leavesByStatus.reduce((acc, i) => acc + i.count, 0);
                                const pct = total > 0 ? ((s.count / total) * 100).toFixed(1) : "0.0";
                                return (
                                    <div key={s.status} className="flex items-center gap-4">
                                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${STATUS_COLORS[s.status] || 'bg-gray-400'}`}></div>
                                        <div className="flex-1">
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="font-medium text-gray-700 capitalize">{s.status.toLowerCase()}</span>
                                                <span className="font-bold text-gray-900">{s.count} <span className="font-normal text-gray-400">({pct}%)</span></span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-2">
                                                <div className={`h-2 rounded-full ${STATUS_COLORS[s.status] || 'bg-gray-400'}`} style={{ width: `${pct}%` }}></div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Most Popular Leave Types */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6">Most Requested Leave Types</h2>
                    {data.topLeaveTypes.length === 0 ? (
                        <p className="text-sm text-gray-400 italic">No leave requests on record.</p>
                    ) : (
                        <div className="space-y-4">
                            {data.topLeaveTypes.map((l, idx) => (
                                <div key={l.name}>
                                    <div className="flex justify-between text-sm mb-1.5">
                                        <span className="font-medium text-gray-700 flex items-center gap-2">
                                            <span className="text-xs text-gray-400 w-4 tabular-nums">#{idx + 1}</span>
                                            {l.name}
                                        </span>
                                        <span className="font-bold text-gray-900 tabular-nums">{l.count}</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                                        <div className="bg-purple-500 h-2.5 rounded-full" style={{ width: `${(l.count / maxLeaveCount) * 100}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Headcount by Employment Type */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6">Employment Type Breakdown</h2>
                    {data.headcountByType.length === 0 ? (
                        <p className="text-sm text-gray-400 italic">No employee data available.</p>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            {data.headcountByType.map(t => (
                                <div key={t.type} className="bg-gray-50 rounded-xl border border-gray-100 p-4 text-center">
                                    <p className="text-3xl font-extrabold text-gray-900">{t.count}</p>
                                    <p className="text-xs font-semibold text-gray-500 capitalize mt-1">{t.type.replace("_", " ")}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
