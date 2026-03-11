"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";

const STATUS_STYLES: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-600",
    PROCESSED: "bg-blue-100 text-blue-700",
    PAID: "bg-green-100 text-green-700",
};

export default function PayslipPage() {
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<any | null>(null);

    useEffect(() => {
        fetch("/api/payroll")
            .then(r => r.json())
            .then(d => { setRecords(Array.isArray(d) ? d : []); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto space-y-4">
                <div className="h-8 w-40 bg-gray-200 animate-pulse rounded-lg"></div>
                {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 animate-pulse rounded-2xl"></div>)}
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">My Payslips</h1>
                <p className="mt-1 text-sm text-gray-500">View your monthly salary statements.</p>
            </div>

            {records.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 flex flex-col items-center text-center">
                    <svg className="w-12 h-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="font-semibold text-gray-700">No payslips yet</p>
                    <p className="text-sm text-gray-400 mt-1">Your payslips will appear here once processed by HR.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {records.map((rec) => (
                        <div
                            key={rec.id}
                            onClick={() => setSelected(rec)}
                            className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer hover:border-blue-200 hover:bg-blue-50/20 transition-all group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="h-11 w-11 min-w-[44px] rounded-xl bg-indigo-100 flex items-center justify-center">
                                    <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">{rec.period}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">Generated on {format(new Date(rec.createdAt), 'MMM d, yyyy')}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <p className="text-xs text-gray-400 uppercase tracking-wider">Net Pay</p>
                                    <p className="text-lg font-extrabold text-gray-900 tabular-nums">₹{rec.netPay.toLocaleString('en-IN')}</p>
                                </div>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${STATUS_STYLES[rec.status] || 'bg-gray-100 text-gray-600'}`}>
                                    {rec.status}
                                </span>
                                <svg className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Payslip Detail Modal */}
            {selected && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        {/* Slip Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-6 text-white">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-blue-200 text-xs uppercase tracking-widest font-semibold">Salary Slip</p>
                                    <h2 className="text-2xl font-extrabold mt-1">{selected.period}</h2>
                                </div>
                                <button onClick={() => setSelected(null)} className="text-blue-200 hover:text-white transition-colors">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                            <p className="text-blue-200 text-sm mt-2">Kapra HRMS</p>
                        </div>

                        {/* Earnings + Deductions */}
                        <div className="p-6 space-y-4">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Earnings</p>
                                <div className="flex justify-between py-2.5 border-b border-gray-100">
                                    <span className="text-sm text-gray-600">Basic Salary</span>
                                    <span className="text-sm font-semibold text-gray-900 tabular-nums">₹{selected.basicSalary.toLocaleString('en-IN')}</span>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Deductions</p>
                                <div className="flex justify-between py-2.5 border-b border-gray-100">
                                    <span className="text-sm text-gray-600">Total Deductions</span>
                                    <span className="text-sm font-semibold text-red-600 tabular-nums">- ₹{selected.deductions.toLocaleString('en-IN')}</span>
                                </div>
                            </div>
                            {selected.notes && (
                                <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-600 border border-gray-100 italic">
                                    {selected.notes}
                                </div>
                            )}
                            {/* Net Pay */}
                            <div className="mt-2 bg-green-50 border border-green-100 rounded-xl px-4 py-4 flex justify-between items-center">
                                <span className="text-sm font-bold text-green-800 uppercase tracking-wide">Net Pay</span>
                                <span className="text-2xl font-extrabold text-green-700 tabular-nums">₹{selected.netPay.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2">
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${STATUS_STYLES[selected.status] || 'bg-gray-100 text-gray-600'}`}>
                                    {selected.status}
                                </span>
                                <p className="text-xs text-gray-400">Issued {format(new Date(selected.createdAt), 'MMMM d, yyyy')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
