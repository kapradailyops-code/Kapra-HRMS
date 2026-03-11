"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useToast } from "../../../components/ToastProvider";

const STATUS_STYLES: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-600",
    PROCESSED: "bg-blue-100 text-blue-700",
    PAID: "bg-green-100 text-green-700",
};

export default function AdminPayrollPage() {
    const { showToast } = useToast();
    const [records, setRecords] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [basicSalary, setBasicSalary] = useState("");
    const [deductions, setDeductions] = useState("0");

    useEffect(() => {
        fetchRecords();
        fetch("/api/employees").then(r => r.json()).then(d => setEmployees(Array.isArray(d) ? d : []));
    }, []);

    const fetchRecords = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/payroll");
            const d = await res.json();
            setRecords(Array.isArray(d) ? d : []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const netPay = parseFloat(basicSalary || "0") - parseFloat(deductions || "0");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitting(true);
        setError("");
        const formData = new FormData(e.currentTarget);
        const payload = {
            employeeId: formData.get("employeeId"),
            period: formData.get("period"),
            basicSalary: parseFloat(formData.get("basicSalary") as string),
            deductions: parseFloat(formData.get("deductions") as string || "0"),
            notes: formData.get("notes"),
            status: "PROCESSED"
        };
        try {
            const res = await fetch("/api/payroll", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error(await res.text());
            setShowModal(false);
            setBasicSalary("");
            setDeductions("0");
            showToast('Payslip generated successfully!', 'success');
            await fetchRecords();
        } catch (err: any) {
            setError(err.message);
            showToast(err.message || 'Failed to generate payslip.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Payroll Management</h1>
                    <p className="mt-1 text-sm text-gray-500">Generate and manage employee salary records.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold shadow-sm hover:bg-blue-700 transition-colors"
                >
                    + Generate Payslip
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: "Total Records", value: records.length, color: "text-gray-900" },
                    { label: "Processed", value: records.filter(r => r.status === 'PROCESSED').length, color: "text-blue-700" },
                    { label: "Paid", value: records.filter(r => r.status === 'PAID').length, color: "text-green-700" },
                    { label: "Total Payout", value: `₹${records.filter(r => r.status !== 'DRAFT').reduce((s, r) => s + r.netPay, 0).toLocaleString('en-IN')}`, color: "text-indigo-700" },
                ].map(c => (
                    <div key={c.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
                        <p className={`text-2xl font-extrabold ${c.color}`}>{c.value}</p>
                        <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-semibold">{c.label}</p>
                    </div>
                ))}
            </div>

            {/* Records Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-400 animate-pulse">Loading records...</div>
                ) : records.length === 0 ? (
                    <div className="p-16 text-center flex flex-col items-center">
                        <svg className="w-12 h-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                        <p className="font-semibold text-gray-700">No payslips generated yet</p>
                        <p className="text-sm text-gray-400 mt-1">Click "+ Generate Payslip" to get started.</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Period</th>
                                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Basic</th>
                                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Deductions</th>
                                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Net Pay</th>
                                <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {records.map((rec) => (
                                <tr key={rec.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="font-semibold text-gray-900">{rec.employee?.firstName} {rec.employee?.lastName}</p>
                                        <p className="text-xs text-gray-400">{rec.employee?.employeeId}</p>
                                    </td>
                                    <td className="px-6 py-4 text-gray-700 font-medium">{rec.period}</td>
                                    <td className="px-6 py-4 text-right tabular-nums text-gray-700">₹{rec.basicSalary.toLocaleString('en-IN')}</td>
                                    <td className="px-6 py-4 text-right tabular-nums text-red-600">- ₹{rec.deductions.toLocaleString('en-IN')}</td>
                                    <td className="px-6 py-4 text-right tabular-nums font-bold text-gray-900">₹{rec.netPay.toLocaleString('en-IN')}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${STATUS_STYLES[rec.status] || 'bg-gray-100 text-gray-600'}`}>
                                            {rec.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Generate Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-lg font-bold text-gray-900">Generate Payslip</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Employee *</label>
                                <select name="employeeId" required className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white shadow-sm">
                                    <option value="">Select employee...</option>
                                    {employees.map((e: any) => (
                                        <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeId})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Period *</label>
                                <input name="period" required placeholder="e.g. March 2026" className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Basic Salary (₹) *</label>
                                    <input name="basicSalary" type="number" required min={0} value={basicSalary} onChange={e => setBasicSalary(e.target.value)} placeholder="50000" className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Deductions (₹)</label>
                                    <input name="deductions" type="number" min={0} value={deductions} onChange={e => setDeductions(e.target.value)} placeholder="0" className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm" />
                                </div>
                            </div>
                            {/* Live Net Pay preview */}
                            {basicSalary && (
                                <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 flex justify-between items-center">
                                    <span className="text-sm font-semibold text-green-800">Net Pay</span>
                                    <span className="text-xl font-extrabold text-green-700">₹{Math.max(0, netPay).toLocaleString('en-IN')}</span>
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notes (Optional)</label>
                                <textarea name="notes" rows={2} className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm resize-none" placeholder="e.g. Includes performance bonus" />
                            </div>
                            <div className="pt-2 flex justify-end gap-3">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors">Cancel</button>
                                <button type="submit" disabled={submitting} className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50">
                                    {submitting ? "Generating..." : "Generate Payslip"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
