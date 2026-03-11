"use client";

import { useState, useEffect } from "react";
import { format, differenceInMinutes } from "date-fns";
import { useToast } from "../../components/ToastProvider";

function formatDuration(clockIn: string, clockOut: string | null): string {
    if (!clockOut) return "—";
    const mins = differenceInMinutes(new Date(clockOut), new Date(clockIn));
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
}

const STATUS_STYLES: Record<string, string> = {
    PRESENT: "bg-green-100 text-green-700",
    LATE: "bg-yellow-100 text-yellow-700",
    HALF_DAY: "bg-blue-100 text-blue-700",
};

export default function EmployeeLeavesPage() {
    const { showToast } = useToast();
    const [data, setData] = useState<{ requests: any[]; balances: any[] }>({ requests: [], balances: [] });
    const [attendance, setAttendance] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState<"leaves" | "attendance">("leaves");

    useEffect(() => {
        fetchData();
        fetchLeaveTypes();
        fetchAttendance();
    }, []);

    const fetchData = async () => {
        try {
            const res = await fetch("/api/leaves/requests");
            const json = await res.json();
            setData(json);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchLeaveTypes = async () => {
        try {
            const res = await fetch("/api/leaves/types");
            setLeaveTypes(await res.json());
        } catch (err) { console.error(err); }
    };

    const fetchAttendance = async () => {
        try {
            const res = await fetch("/api/attendance?history=true");
            setAttendance(await res.json());
        } catch (err) { console.error(err); }
    };

    const handleRequestSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitting(true);
        setError("");
        const formData = new FormData(e.currentTarget);
        const payload = Object.fromEntries(formData.entries());
        try {
            const res = await fetch("/api/leaves/requests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error("Failed to submit request");
            await fetchData();
            setShowModal(false);
            showToast('Leave request submitted successfully!', 'success');
        } catch (err: any) {
            setError(err.message || "An error occurred");
            showToast(err.message || 'Failed to submit leave request.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Leaves & Attendance</h1>
                    <p className="mt-1 text-sm text-gray-500">Manage your time off, view balances, and track attendance records.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold shadow-sm hover:bg-blue-700 transition-colors"
                >
                    Request Time Off
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
                {(["leaves", "attendance"] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === tab
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        {tab === "leaves" ? "Leave Requests" : "Attendance Log"}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 animate-pulse rounded-2xl"></div>)}
                </div>
            ) : activeTab === "leaves" ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Leave Requests */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                            <h2 className="text-lg font-bold text-gray-900 mb-6">Recent Requests</h2>
                            {data.requests.length === 0 ? (
                                <p className="text-sm text-gray-500 italic">No recent leave requests found.</p>
                            ) : (
                                <div className="space-y-4">
                                    {data.requests.map((req: any) => (
                                        <div key={req.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-white transition-colors">
                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <h3 className="font-semibold text-gray-900">{req.leaveType.name}</h3>
                                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${req.status === 'APPROVED' ? 'bg-green-100 text-green-700' : req.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                        {req.status}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    {format(new Date(req.startDate), 'MMM d')} – {format(new Date(req.endDate), 'MMM d, yyyy')}
                                                </p>
                                                {req.reason && <p className="text-sm text-gray-600 mt-2 border-l-2 border-gray-200 pl-2 italic">"{req.reason}"</p>}
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-xs text-gray-400">Requested on</p>
                                                <p className="text-sm font-medium text-gray-900">{format(new Date(req.createdAt), 'MMM d, yyyy')}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Leave Balances Sidebar */}
                    <div>
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Current Balances</h3>
                            {data.balances.length === 0 ? (
                                <p className="text-sm text-gray-500 italic">No leave balances tracked.</p>
                            ) : (
                                <div className="space-y-4">
                                    {data.balances.map((bal: any) => (
                                        <div key={bal.id} className="border border-gray-100 rounded-xl p-4 flex flex-col items-center justify-center text-center bg-gray-50">
                                            <p className="text-sm font-semibold text-gray-600 mb-2">{bal.leaveType.name}</p>
                                            <p className="text-4xl font-extrabold text-blue-700">{bal.balance + bal.carryOverBalance}</p>
                                            <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-semibold">Days Available</p>
                                            {bal.carryOverBalance > 0 && (
                                                <p className="text-xs text-indigo-600 mt-2 font-medium bg-indigo-50 px-2 py-1 rounded-full">Includes {bal.carryOverBalance} carried over</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                /* Attendance Log Tab */
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="text-base font-bold text-gray-900">Attendance History <span className="text-sm font-normal text-gray-400 ml-1">(Last 30 days)</span></h2>
                        <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500"></span> Present</span>
                            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-500"></span> Late</span>
                            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Half Day</span>
                        </div>
                    </div>

                    {attendance.length === 0 ? (
                        <div className="p-16 text-center flex flex-col items-center">
                            <svg className="w-12 h-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <p className="font-semibold text-gray-700">No attendance records yet</p>
                            <p className="text-sm text-gray-400 mt-1">Clock in from your dashboard to start tracking.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Clock In</th>
                                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Clock Out</th>
                                        <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Hours Worked</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {attendance.map((rec: any) => {
                                        const hoursWorked = rec.clockOut
                                            ? differenceInMinutes(new Date(rec.clockOut), new Date(rec.clockIn)) / 60
                                            : null;
                                        const isLong = hoursWorked !== null && hoursWorked >= 8;
                                        return (
                                            <tr key={rec.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4 font-semibold text-gray-900 whitespace-nowrap">
                                                    {format(new Date(rec.date), 'EEE, MMM d yyyy')}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${STATUS_STYLES[rec.status] || 'bg-gray-100 text-gray-600'}`}>
                                                        {rec.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-700 tabular-nums font-mono">
                                                    {format(new Date(rec.clockIn), 'h:mm a')}
                                                </td>
                                                <td className="px-6 py-4 text-gray-700 tabular-nums font-mono">
                                                    {rec.clockOut ? format(new Date(rec.clockOut), 'h:mm a') : (
                                                        <span className="text-blue-600 font-sans font-medium text-xs flex items-center gap-1">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span> Still in
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {hoursWorked !== null ? (
                                                        <span className={`font-bold tabular-nums ${isLong ? 'text-green-600' : 'text-gray-700'}`}>
                                                            {formatDuration(rec.clockIn, rec.clockOut)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400">—</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Request Leave Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-lg font-bold text-gray-900">Request Time Off</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <form onSubmit={handleRequestSubmit} className="p-6 space-y-6">
                            {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">{error}</div>}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Leave Type</label>
                                <select name="leaveTypeId" required className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm bg-white">
                                    <option value="">Select a type...</option>
                                    {leaveTypes.map((type: any) => (
                                        <option key={type.id} value={type.id}>{type.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Start Date</label>
                                    <input type="date" name="startDate" required className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">End Date</label>
                                    <input type="date" name="endDate" required className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Reason (Optional)</label>
                                <textarea name="reason" rows={3} placeholder="Brief description..." className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm resize-none"></textarea>
                            </div>
                            <div className="pt-2 flex justify-end gap-3">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors">Cancel</button>
                                <button type="submit" disabled={submitting} className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2">
                                    {submitting && <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                                    {submitting ? "Submitting..." : "Submit Request"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
