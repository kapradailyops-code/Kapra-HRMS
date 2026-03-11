"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LeavePoliciesPage() {
    const router = useRouter();
    const [policies, setPolicies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchPolicies();
    }, []);

    const fetchPolicies = async () => {
        try {
            const res = await fetch("/api/leaves/types");
            const data = await res.json();
            setPolicies(data);
        } catch (err) {
            console.error(err);
            setError("Failed to load policies");
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setCreating(true);
        setError("");

        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());

        try {
            const res = await fetch("/api/leaves/types", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) throw new Error("Failed to create policy");

            await fetchPolicies();
            (e.target as HTMLFormElement).reset();
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred");
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Leave Policies</h1>
                <p className="mt-1 text-sm text-gray-500">Configure leave types, accrual rates, and carry-over rules for the organization.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Create Form */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:col-span-1 h-fit">
                    <h2 className="text-lg font-bold text-gray-900 mb-6">Create New Policy</h2>
                    {error && <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>}

                    <form onSubmit={handleCreate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Policy Name</label>
                            <input type="text" name="name" required placeholder="e.g. Annual Leave" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Accrual Rate</label>
                            <div className="flex items-center gap-2 mt-1">
                                <input type="number" step="0.5" name="accrualRate" required placeholder="1.25" className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                                <span className="text-sm text-gray-500">days /</span>
                                <select name="accrualPeriod" className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                                    <option value="MONTHLY">Month</option>
                                    <option value="YEARLY">Year</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Max Carry Over</label>
                                <input type="number" step="0.5" name="maxCarryOver" defaultValue="0" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Expiry (Months)</label>
                                <input type="number" name="carryOverExpiryMonths" placeholder="12" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Probation Period (Months)</label>
                            <input type="number" name="probationPeriodMonths" defaultValue="0" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        </div>

                        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                            <label className="flex items-center gap-2 text-sm text-gray-700">
                                <input type="checkbox" name="requiresApproval" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                Requires Approval
                            </label>
                            <button
                                type="submit"
                                disabled={creating}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                {creating ? "Saving..." : "Save Policy"}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Policies List */}
                <div className="lg:col-span-2 space-y-4">
                    {loading ? (
                        <p className="text-gray-500 animate-pulse">Loading policies...</p>
                    ) : policies.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                            <p className="text-gray-500 mb-2">No leave policies found.</p>
                            <p className="text-sm text-gray-400">Create one using the form to get started.</p>
                        </div>
                    ) : (
                        policies.map((policy: any) => (
                            <div key={policy.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-center">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 group flex items-center gap-2">
                                        {policy.name}
                                        {!policy.requiresApproval && (
                                            <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold uppercase">Auto-Approve</span>
                                        )}
                                    </h3>
                                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-600">
                                        <p><span className="font-medium text-gray-900">Accrues:</span> {policy.accrualRate} / {policy.accrualPeriod.toLowerCase()}</p>
                                        <p><span className="font-medium text-gray-900">Max Carry Over:</span> {policy.maxCarryOver || 0} days</p>
                                        <p><span className="font-medium text-gray-900">Probation:</span> {policy.probationPeriodMonths} months</p>
                                    </div>
                                </div>
                                <button className="px-3 py-1.5 text-sm text-gray-600 hover:text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition-colors">
                                    Edit
                                </button>
                            </div>
                        ))
                    )}
                </div>

            </div>
        </div>
    );
}
